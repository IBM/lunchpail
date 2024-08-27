package controller

type Controller interface {
	// Reconfigure a pool to have a `delta` number of workers
	ChangeWorkers(poolName, poolNamespace, context string, delta int) error
}
