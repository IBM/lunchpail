package kubernetes

import (
	"context"
	"fmt"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func ChangeWorkers(poolName, poolNamespace, poolContext string, delta int) error {
	// TODO handle poolContext!!!
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	jobsClient := clientset.BatchV1().Jobs(poolNamespace)
	job, err := jobsClient.Get(context.Background(), poolName, metav1.GetOptions{})
	if err != nil {
		return err
	}

	patch := []byte(fmt.Sprintf(`{"spec": {"parallelism": %d}}`, *job.Spec.Parallelism+int32(delta)))
	if _, err := jobsClient.Patch(context.Background(), poolName, types.StrategicMergePatchType, patch, metav1.PatchOptions{}); err != nil {
		return err
	}

	return nil
}
