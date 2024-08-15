package kubernetes

import (
	"context"
	"slices"
	"strings"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"

	"lunchpail.io/pkg/be/platform"
)

func openshiftSpecificValues(clientset *k8s.Clientset) (platform.Values, error) {
	var values platform.Values

	namespaces, err := clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return values, err
	}

	openshiftIdx := slices.IndexFunc(namespaces.Items, func(ns corev1.Namespace) bool { return strings.Contains(ns.Name, "openshift") })
	if openshiftIdx >= 0 {
		values.Kv = append(values.Kv, "global.type=oc")
		values.NeedsServiceAccount = true
	}

	return values, nil
}

func (backend Backend) Values() (platform.Values, error) {
	clientset, _, err := Client()
	if err != nil {
		return platform.Values{}, err
	}

	openshiftValues, err := openshiftSpecificValues(clientset)
	if err != nil {
		return platform.Values{}, err
	}

	return openshiftValues, nil
}
