package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir/queue"
)

type Streamer struct {
	context.Context
	run     queue.RunContext
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer(ctx context.Context, run queue.RunContext) streamer.Streamer {
	return Streamer{ctx, run, backend}
}
