package kubernetes

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
)

func retryOnError(err error) bool {
	if strings.Contains(err.Error(), "connection refused") {
		time.Sleep(3 * time.Second)
		return true
	}

	return false
}

func (backend Backend) portForward(ctx context.Context, podName string, localPort, podPort int) (func(), error) {
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

	// managing termination signal from the terminal. As you can see the stopCh
	// gets closed to gracefully handle its termination.
	/*sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	group.Go(func() error {
		<-sigs
		close(stopCh)
		return nil
	})*/

	go func() error {
		for {
			path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward",
				backend.namespace, podName)
			hostIP := strings.TrimLeft(restConfig.Host, "htps:/")

			transport, upgrader, err := spdy.RoundTripperFor(restConfig)
			if err != nil {
				if !retryOnError(err) {
					fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1")
					return err
				}
				continue
			}

			stdout := ioutil.Discard // TODO verbose?
			stderr := os.Stderr

			dialer := spdy.NewDialer(upgrader, &http.Client{Transport: transport}, http.MethodPost, &url.URL{Scheme: "https", Path: path, Host: hostIP})

			fw, err := portforward.New(dialer, []string{fmt.Sprintf("%d:%d", localPort, podPort)}, stopCh, readyCh, stdout, stderr)
			if err != nil {
				if !retryOnError(err) {
					fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!2")
					return err
				}
				continue
			}

			if err := fw.ForwardPorts(); err != nil {
				if !retryOnError(err) {
					fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!3")
					return err
				}
				continue
			}
		}
	}()

	// wait for it to be ready
	select {
	case <-readyCh:
		break
	}

	stop := func() {
		close(stopCh)
	}

	return stop, nil
}
