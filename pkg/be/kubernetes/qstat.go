package kubernetes

import (
	"fmt"
	"os"
	"strings"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/be/events/qstat"
	streamerCommon "lunchpail.io/pkg/be/streamer"
)

func (streamer Streamer) streamModel(follow bool, tail int64, quiet bool, c chan qstat.Model) error {
	opts := v1.PodLogOptions{Follow: follow}
	if tail != -1 {
		opts.TailLines = &tail
	}

	clientset, _, err := Client()
	if err != nil {
		return err
	}

	pods, err := clientset.CoreV1().Pods(streamer.backend.namespace).List(streamer.Context, metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=workstealer,app.kubernetes.io/instance=" + streamer.runname})
	if err != nil {
		return err
	} else if len(pods.Items) == 0 {
		return fmt.Errorf("Cannot find run in namespace=%s\n", streamer.backend.namespace)
	} else if len(pods.Items) > 1 {
		return fmt.Errorf("Multiple matching runs found in namespace=%s\n", streamer.backend.namespace)
	}

	podLogs := clientset.CoreV1().Pods(streamer.backend.namespace).GetLogs(pods.Items[0].Name, &opts)
	stream, err := podLogs.Stream(streamer.Context)
	if err != nil {
		if strings.Contains(err.Error(), "waiting to start") {
			if !quiet {
				fmt.Fprintf(os.Stderr, "Waiting for app to start...\n")
			}
			time.Sleep(2 * time.Second)
			// TODO update this to use the kubernetes watch api?
			return streamer.streamModel(follow, tail, quiet, c)
		} else {
			return err
		}
	}

	return streamerCommon.QstatFromStream(streamer.Context, stream, c)
}

func (streamer Streamer) QueueStats(c chan qstat.Model, opts qstat.Options) error {
	return streamer.streamModel(opts.Follow, opts.Tail, opts.Quiet, c)
}
