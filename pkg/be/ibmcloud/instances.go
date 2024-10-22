package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

// Number of instances of the given component for the given run
func (backend Backend) InstanceCount(ctx context.Context, c lunchpail.Component, run queue.RunContext) (int, error) {
	return 0, nil
}
