package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/be/streamer"
)

type Streamer struct {
	context.Context
	runname string
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer(ctx context.Context, runname string) streamer.Streamer {
	return Streamer{ctx, runname, backend}
}
