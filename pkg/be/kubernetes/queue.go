package kubernetes

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/fe/linker/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, prefixPath, err = backend.Queue(runname)
	if err != nil {
		return
	}

	if strings.Contains(endpoint, "cluster.local") {
		// Then the queue is running inside the cluster. We
		// will need to open a port forward.
		podName, perr := backend.getMinioPodName(ctx, runname)
		if perr != nil {
			err = perr
			return
		}

		fmt.Fprintf(os.Stderr, "Opening port forward to pod=%s\n", podName)
		podPort := 9000 // TODO hard-wired
		localPort := 50001
		for localPort < 1000 {
			localPort = rand.Intn(65535) + 1
		}

		if s, perr := backend.portForward(ctx, podName, localPort, podPort); perr != nil {
			err = perr
			return
		} else {
			stop = s
		}

		oendpoint := endpoint
		endpoint = fmt.Sprintf("http://localhost:%d", localPort)
		fmt.Fprintf(os.Stderr, "Port forwarding with endpoint=%s -> %s\n", oendpoint, endpoint)
	}

	return
}

func (backend Backend) Queue(runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, err error) {
	endpoint = os.Getenv("lunchpail_queue_endpoint")
	accessKeyID = os.Getenv("lunchpail_queue_accessKeyID")
	secretAccessKey = os.Getenv("lunchpail_queue_secretAccessKey")
	bucket = os.Getenv("LUNCHPAIL_QUEUE_BUCKET")
	prefixPath = os.Getenv("LUNCHPAIL_QUEUE_PATH")
	err = nil

	if endpoint == "" {
		c, _, cerr := Client()
		if cerr != nil {
			err = cerr
			return
		}

		secret, cerr := c.CoreV1().Secrets(backend.namespace).Get(context.Background(), queue.Name(runname), metav1.GetOptions{})
		if cerr != nil {
			err = cerr
			return
		}

		if bytes, ok := secret.Data["endpoint"]; !ok {
			err = fmt.Errorf("Secret is missing 'endpoint'")
			return
		} else {
			endpoint = string(bytes)
		}

		if bytes, ok := secret.Data["accessKeyID"]; !ok {
			err = fmt.Errorf("Secret is missing 'accessKeyID'")
			return
		} else {
			accessKeyID = string(bytes)
		}

		if bytes, ok := secret.Data["secretAccessKey"]; !ok {
			err = fmt.Errorf("Secret is missing 'secretAccessKey'")
			return
		} else {
			secretAccessKey = string(bytes)
		}

		if bytes, ok := secret.Data["queuePrefixPath"]; !ok {
			err = fmt.Errorf("Secret is missing 'queuePrefixPath'")
			return
		} else {
			prefixPath = string(bytes)
		}

		if bytes, ok := secret.Data["bucket"]; !ok {
			err = fmt.Errorf("Secret is missing 'bucket'")
			return
		} else {
			bucket = string(bytes)
		}
	}

	return
}

func (backend Backend) getMinioPodName(ctx context.Context, runname string) (string, error) {
	client, _, err := Client()
	if err != nil {
		return "", err
	}

	pods, err := client.CoreV1().Pods(backend.namespace).List(ctx, metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=minio,app.kubernetes.io/instance=" + runname})
	if err != nil {
		return "", err
	} else if len(pods.Items) == 0 {
		return "", fmt.Errorf("Cannot find minio component pod for run=%s", runname)
	} else if len(pods.Items) > 1 {
		names := []string{}
		for _, pod := range pods.Items {
			names = append(names, pod.Name)
		}
		return "", fmt.Errorf("Found multiple minio component pods for run=%s. Found %v", runname, names)
	}

	return pods.Items[0].Name, nil
}
