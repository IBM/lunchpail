package kubernetes

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/be/runs"
)

func deleteNamespace(ctx context.Context, namespace string) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	api := clientset.CoreV1().Namespaces()
	if err := api.Delete(ctx, namespace, metav1.DeleteOptions{}); err != nil {
		return err
	}
	fmt.Printf("namespace \"%s\" deleted\n", namespace)
	return nil
}

func (backend Backend) Purge(ctx context.Context) error {
	remainingRuns, err := backend.ListRuns(ctx, false)
	if err != nil {
		return err
	} else if len(remainingRuns) != 0 {
		return fmt.Errorf("Non-empty namespace %s still has %d runs:\n%s", backend.namespace, len(remainingRuns), runs.Pretty(remainingRuns))
	} else if err := deleteNamespace(ctx, backend.namespace); err != nil {
		return err
	}

	return nil
}
