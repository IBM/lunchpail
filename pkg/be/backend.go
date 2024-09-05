package be

import (
	"context"

	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok() error

	// Bring up the linked application
	Up(linked llir.LLIR, opts llir.Options, verbose bool) error

	// Bring down the linked application
	Down(linked llir.LLIR, opts llir.Options, verbose bool) error

	// Return a string to convey relevant dry-run info
	DryRun(ir llir.LLIR, opts llir.Options, verbose bool) (string, error)

	// Purge any non-run resources that may have been created
	Purge() error

	// List deployed runs
	ListRuns() ([]runs.Run, error)

	// Number of instances of the given component for the given run
	InstanceCount(c lunchpail.Component, runname string) (int, error)

	// Queue properties for a given run
	Queue(runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, err error)

	// Queue properties for a given run, plus ensure access to the endpoint from this client
	AccessQueue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, stop func(), err error)

	// Return a streamer
	Streamer() streamer.Streamer
}
