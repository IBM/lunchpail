package ibmcloud

import (
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/events/qstat"
)

func (streamer Streamer) QueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error) {
	return nil, nil, fmt.Errorf("Unsupported operation: 'StreamQueueStats'")
}
