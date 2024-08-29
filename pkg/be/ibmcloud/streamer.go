//go:build full || observe

package ibmcloud

import "lunchpail.io/pkg/be/streamer"

type Streamer struct {
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer() streamer.Streamer {
	return Streamer{backend}
}
