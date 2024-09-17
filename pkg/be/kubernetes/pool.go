package kubernetes

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"

	"lunchpail.io/pkg/be/kubernetes/shell"
	"lunchpail.io/pkg/lunchpail"
)

func (backend Backend) ChangeWorkers(ctx context.Context, poolName, poolNamespace, poolContext string, delta int) error {
	// TODO handle poolContext!!!
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	k8sName := shell.ResourceName(poolName, lunchpail.WorkersComponent)

	jobsClient := clientset.BatchV1().Jobs(poolNamespace)
	job, err := jobsClient.Get(ctx, k8sName, metav1.GetOptions{})
	if err != nil {
		return err
	}

	patch := []byte(fmt.Sprintf(`{"spec": {"parallelism": %d}}`, *job.Spec.Parallelism+int32(delta)))
	if _, err := jobsClient.Patch(ctx, k8sName, types.StrategicMergePatchType, patch, metav1.PatchOptions{}); err != nil {
		return err
	}

	return nil
}
