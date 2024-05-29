package be

import (
	"lunchpail.io/pkg/be/kubernetes"
)

func ChangeWorkers(poolName, poolNamespace, context string, delta int) error {
	return kubernetes.ChangeWorkers(poolName, poolNamespace, context, delta)
}
