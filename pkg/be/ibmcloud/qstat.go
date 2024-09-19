package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events/qstat"
)

func (streamer Streamer) QueueStats(c chan qstat.Model, opts qstat.Options) error {
	return fmt.Errorf("Unsupported operation: 'StreamQueueStats'")
}
