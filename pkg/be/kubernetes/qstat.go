package kubernetes

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/be/events/qstat"
	streamerCommon "lunchpail.io/pkg/be/streamer"
)

func (streamer Streamer) streamModel(runname string, follow bool, tail int64, quiet bool, c chan qstat.Model) error {
	opts := v1.PodLogOptions{Follow: follow}
	if tail != -1 {
		opts.TailLines = &tail
	}

	clientset, _, err := Client()
	if err != nil {
		return err
	}

	pods, err := clientset.CoreV1().Pods(streamer.backend.namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=workstealer,app.kubernetes.io/instance=" + runname})
	if err != nil {
		return err
	} else if len(pods.Items) == 0 {
		return fmt.Errorf("Cannot find run in namespace=%s\n", streamer.backend.namespace)
	} else if len(pods.Items) > 1 {
		return fmt.Errorf("Multiple matching runs found in namespace=%s\n", streamer.backend.namespace)
	}

	podLogs := clientset.CoreV1().Pods(streamer.backend.namespace).GetLogs(pods.Items[0].Name, &opts)
	stream, err := podLogs.Stream(context.TODO())
	if err != nil {
		if strings.Contains(err.Error(), "waiting to start") {
			if !quiet {
				fmt.Fprintf(os.Stderr, "Waiting for app to start...\n")
			}
			time.Sleep(2 * time.Second)
			// TODO update this to use the kubernetes watch api?
			return streamer.streamModel(runname, follow, tail, quiet, c)
		} else {
			return err
		}
	}

	return streamerCommon.QstatFromStream(stream, c)
}

func (streamer Streamer) QueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error) {
	c := make(chan qstat.Model)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := streamer.streamModel(runname, opts.Follow, opts.Tail, opts.Quiet, c)
		close(c)
		return err
	})

	return c, errs, nil
}
