package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events/utilization"
)

// Stream cpu and memory statistics
func (backend Backend) StreamUtilization(runname string, intervalSeconds int) (chan utilization.Model, error) {
	return nil, fmt.Errorf("Unsupported operation: 'StreamUtilization'")
}
