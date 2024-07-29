package kubernetes

import (
	"context"
	"slices"
	"strings"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

func openshiftSpecificValues(clientset *k8s.Clientset) ([]string, error) {
	namespaces, err := clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	openshiftIdx := slices.IndexFunc(namespaces.Items, func(ns corev1.Namespace) bool { return strings.Contains(ns.Name, "openshift") })
	if openshiftIdx >= 0 {
		return []string{"clusterType=oc"}, nil
	}

	return []string{}, nil
}

func Values() ([]string, error) {
	clientset, _, err := Client()
	if err != nil {
		return nil, err
	}

	openshiftValues, err := openshiftSpecificValues(clientset)
	if err != nil {
		return nil, err
	}

	return openshiftValues, nil
}
