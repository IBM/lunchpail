package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/lunchpail"
)

// Number of instances of the given component for the given run
func (backend Backend) InstanceCount(ctx context.Context, c lunchpail.Component, runname string) (int, error) {
	return 0, nil
}
