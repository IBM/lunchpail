package be

import (
	"context"

	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok(ctx context.Context, initOk bool) error

	// Bring up the linked application
	Up(ctx context.Context, linked llir.LLIR, opts llir.Options, isRunning chan struct{}) error

	// Bring down the linked application
	Down(ctx context.Context, linked llir.LLIR, opts llir.Options) error

	// Return a string to convey relevant dry-run info
	DryRun(ir llir.LLIR, opts llir.Options) (string, error)

	// Purge any non-run resources that may have been created
	Purge(ctx context.Context) error

	// List runs for this application. If !all, then include only live runs, otherwise also include terminated runs as well.
	ListRuns(ctx context.Context, all bool) ([]runs.Run, error)

	// Number of instances of the given component for the given run
	InstanceCount(ctx context.Context, c lunchpail.Component, run queue.RunContext) (int, error)

	// Queue properties for a given run
	Queue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, err error)

	// Queue properties for a given run, plus ensure access to the endpoint from this client
	AccessQueue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error)

	// Return a streamer
	Streamer(ctx context.Context, run queue.RunContext) streamer.Streamer
}
