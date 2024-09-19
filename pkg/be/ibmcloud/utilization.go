package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events/utilization"
)

// Stream cpu and memory statistics
func (streamer Streamer) Utilization(c chan utilization.Model, intervalSeconds int) error {
	return fmt.Errorf("Unsupported operation: 'Utilization'")
}
