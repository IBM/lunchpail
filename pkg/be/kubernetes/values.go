package kubernetes

import (
	"context"
	"slices"
	"strings"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"

	"lunchpail.io/pkg/be/kubernetes/common"
	"lunchpail.io/pkg/ir/llir"
)

func isOpenShift(ctx context.Context, clientset *k8s.Clientset) (bool, error) {
	namespaces, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return false, err
	}

	openshiftIdx := slices.IndexFunc(namespaces.Items, func(ns corev1.Namespace) bool { return strings.Contains(ns.Name, "openshift") })
	if openshiftIdx >= 0 {
		return true, nil
	}

	return false, nil
}

func k8sOptions(ctx context.Context, copts llir.Options) (common.Options, error) {
	opts := common.Options{Options: copts}

	clientset, _, err := Client()
	if err != nil {
		return opts, err
	}

	oc, err := isOpenShift(ctx, clientset)
	if err != nil {
		return opts, err
	}

	if oc {
		opts.NeedsServiceAccount = true
		opts.NeedsSecurityContextConstraint = true
	}

	return opts, nil
}
