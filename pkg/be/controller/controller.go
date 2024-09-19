package controller

import "context"

type Controller interface {
	// Reconfigure a pool to have a `delta` number of workers
	ChangeWorkers(ctx context.Context, poolName, context string, delta int) error
}
