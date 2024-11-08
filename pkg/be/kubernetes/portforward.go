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

	if strings.Contains(err.Error(), "connection refused") {
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

	if err := waitForPodRunning(ctx, c, backend.namespace, podName, 30*time.Second); err != nil {
		return func() {}, err
	}

	// stopCh control the port forwarding lifecycle. When it gets closed the
	// port forward will terminate
	stopCh := make(chan struct{}, 1)
	// readyCh communicate when the port forward is ready to get traffic
	readyCh := make(chan struct{})

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

		for !done {
			select {
			case <-ctx.Done():
				return nil
			default:
			}

			path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward",
				backend.namespace, podName)
			hostIP := strings.TrimLeft(restConfig.Host, "htps:/")

			transport, upgrader, err := spdy.RoundTripperFor(restConfig)
			if err != nil {
				if !retryOnError(ctx, err) {
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

			fw, err := portforward.New(dialer, []string{fmt.Sprintf("%d:%d", localPort, podPort)}, stopCh, readyCh, stdout, stderr)
			if err != nil {
				if !retryOnError(ctx, err) {
					return err
				}
				continue
			}

			if err := fw.ForwardPorts(); err != nil {
				if !retryOnError(ctx, err) {
					return err
				}
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
	<-readyCh

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
