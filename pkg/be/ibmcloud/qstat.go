package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events/qstat"
)

func (streamer Streamer) QueueStats(opts qstat.Options) (chan qstat.Model, error) {
	return nil, fmt.Errorf("Unsupported operation: 'StreamQueueStats'")
}
