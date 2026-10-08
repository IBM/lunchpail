package kubernetes

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"

	"lunchpail.io/pkg/build"
)

func retryOnError(ctx context.Context, err error) bool {
	select {
	case <-ctx.Done():
		return false
	default:
	}

	if os.Getenv("LUNCHPAIL_WAIT") != "false" && strings.Contains(err.Error(), "connection refused") {
		time.Sleep(2 * time.Second)
		return true
	}

	return false
}

func (backend Backend) portForward(ctx context.Context, podName string, localPort, podPort int, opts build.LogOptions) (func(), error) {
	c, restConfig, err := Client()
	if err != nil {
		return func() {}, err
	}

	if os.Getenv("LUNCHPAIL_WAIT") != "false" {
		if err := waitForPodRunning(ctx, c, backend.namespace, podName, 30*time.Second); err != nil {
			return func() {}, err
		}
	}

	// stopCh control the port forwarding lifecycle. When it gets closed the
	// port forward will terminate
	stopCh := make(chan struct{}, 1)
	// readyCh communicate when the port forward is ready to get traffic
	readyCh := make(chan struct{})
	// errorCh to communicate port forwarding errors
	errorCh := make(chan error, 1)

	// we will set this below when a successfully launched
	// portforwarder exits normally
	done := false

	// managing termination signal from the terminal. As you can see the stopCh
	// gets closed to gracefully handle its termination.
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() error {
		<-sigs
		if !done {
			if opts.Debug {
				fmt.Fprintln(os.Stderr, "SIGINT/TERM has initiated close of portforward closed", os.Args)
			}
			done = true
			close(stopCh)
		}
		return nil
	}()

	go func() error {
		// hmmm... the client-go portforward.go logs an UnhandledError when things are all done and good...
		// portforward.go:413] "Unhandled Error" err="an error occurred forwarding
		runtime.ErrorHandlers = []runtime.ErrorHandler{}

		// whether we have already signaled readiness on readyCh
		// (which the caller consumes exactly once)
		readyOnce := false
		signalReady := func() {
			if !readyOnce {
				readyOnce = true
				readyCh <- struct{}{}
			}
		}

		// number of consecutive mid-life forward failures; the
		// forward is recreated after each, but we give up (and stop
		// leaking a local listener that clients would retry against
		// for their entire retry budget) after too many in a row
		consecutiveFailures := 0
		const maxConsecutiveFailures = 150 // ~5m at 2s per recreate

		for !done {
			select {
			case <-ctx.Done():
				signalReady()
				return nil
			default:
			}

			path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward",
				backend.namespace, podName)
			hostIP := strings.TrimLeft(restConfig.Host, "htps:/")

			transport, upgrader, err := spdy.RoundTripperFor(restConfig)
			if err != nil {
				if !retryOnError(ctx, err) {
					errorCh <- err
					return err
				}
				continue
			}

			stdout := ioutil.Discard
			stderr := ioutil.Discard
			if opts.Verbose {
				stdout = os.Stderr
				stderr = os.Stderr
			}

			dialer := spdy.NewDialer(upgrader, &http.Client{Transport: transport}, http.MethodPost, &url.URL{Scheme: "https", Path: path, Host: hostIP})

			// per-forward readiness, buffered so that a recreated
			// forward's readiness signal can never block the loop
			fwReady := make(chan struct{}, 1)
			fw, err := portforward.New(dialer, []string{fmt.Sprintf("%d:%d", localPort, podPort)}, stopCh, fwReady, stdout, stderr)
			if err != nil {
				if !retryOnError(ctx, err) {
					signalReady()
					errorCh <- err
					return err
				}
				continue
			}

			fwErr := make(chan error, 1)
			go func() { fwErr <- fw.ForwardPorts() }()

			// wait for this forward to be ready before handing
			// traffic to it
			select {
			case <-fwReady:
			case err := <-fwErr:
				// the forward failed before becoming ready
				// (e.g. the pod is not running yet)
				if !retryOnError(ctx, err) {
					signalReady()
					errorCh <- err
					return err
				}
				continue
			case <-stopCh:
				return nil
			}

			signalReady()
			consecutiveFailures = 0

			// the forward is up; wait for it to end
			if err := <-fwErr; err != nil && ctx.Err() == nil {
				// The forward died mid-life (e.g. the tunnel
				// dropped while the target service was still
				// starting). Recreate it: clients retrying
				// against the local listener would otherwise
				// see a dead port until their retry budget is
				// exhausted.
				consecutiveFailures++
				if consecutiveFailures > maxConsecutiveFailures {
					errorCh <- err
					return err
				}
				if opts.Verbose {
					fmt.Fprintf(os.Stderr, "Portforward died (%v); recreating (attempt %d)\n", err, consecutiveFailures)
				}
				time.Sleep(2 * time.Second)
				continue
			}

			if opts.Verbose {
				fmt.Fprintln(os.Stderr, "Portforward closed", os.Args)
			}
			done = true
		}

		return nil
	}()

	// wait for it to be ready
	select {
	case <-ctx.Done():
	case <-readyCh:
	case err := <-errorCh:
		return nil, err
	}

	stop := func() {
		// hmm... for kubernetes backends, this can result in a panic: close on closed channel
		if !done {
			if opts.Debug {
				fmt.Fprintln(os.Stderr, "Client has requested close of portforward closed", os.Args)
			}
			done = true
			close(stopCh)
		}
	}

	return stop, nil
}
