package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/lunchpail"
)

// Stream logs from a given Component to the given channel
func (streamer Streamer) ComponentLogs(component lunchpail.Component, opts streamer.LogOptions) error {
	return fmt.Errorf("Unsupported operation: 'ComponentLogs'")
}
