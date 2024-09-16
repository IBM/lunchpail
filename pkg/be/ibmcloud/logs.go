package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/lunchpail"
)

// Stream logs from a given Component to the given channel
func (streamer Streamer) ComponentLogs(component lunchpail.Component, tail int, follow, verbose bool) error {
	return fmt.Errorf("Unsupported operation: 'ComponentLogs'")
}
