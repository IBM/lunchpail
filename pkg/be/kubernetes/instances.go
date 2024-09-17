package kubernetes

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/lunchpail"
)

// Number of instances of the given component for the given run
func (backend Backend) InstanceCount(ctx context.Context, component lunchpail.Component, runname string) (int, error) {
	c, _, err := Client()
	if err != nil {
		return 0, err
	}

	pods, err := c.CoreV1().Pods(backend.namespace).List(ctx, metav1.ListOptions{
		FieldSelector: "status.phase=Running",
		LabelSelector: "app.kubernetes.io/component=" + string(component) + ",app.kubernetes.io/instance=" + runname,
	})
	if err != nil {
		return 0, err
	}

	return len(pods.Items), nil
}
