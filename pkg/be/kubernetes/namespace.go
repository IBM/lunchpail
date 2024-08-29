package kubernetes

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"lunchpail.io/pkg/be/runs"
)

func deleteNamespace(namespace string) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	api := clientset.CoreV1().Namespaces()
	if err := api.Delete(context.Background(), namespace, metav1.DeleteOptions{}); err != nil {
		return err
	}
	fmt.Printf("namespace \"%s\" deleted\n", namespace)
	return nil
}

func (backend Backend) Purge() error {
	remainingRuns, err := backend.ListRuns()
	if err != nil {
		return err
	} else if len(remainingRuns) != 0 {
		return fmt.Errorf("Non-empty namespace %s still has %d runs:\n%s", backend.namespace, len(remainingRuns), runs.Pretty(remainingRuns))
	} else if err := deleteNamespace(backend.namespace); err != nil {
		return err
	}

	return nil
}
