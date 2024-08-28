package ibmcloud

import (
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/events/qstat"
)

func (backend Backend) StreamQueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error) {
	return nil, nil, fmt.Errorf("Unsupported operation: 'StreamQueueStats'")
}
