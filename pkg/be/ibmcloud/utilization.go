//go:build full || observe

package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events/utilization"
)

// Stream cpu and memory statistics
func (streamer Streamer) Utilization(runname string, intervalSeconds int) (chan utilization.Model, error) {
	return nil, fmt.Errorf("Unsupported operation: 'StreamUtilization'")
}
