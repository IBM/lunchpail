package be

import (
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok() error

	// Bring up the linked application
	Up(linked llir.LLIR, opts compilation.Options, verbose bool) error

	// Bring down the linked application
	Down(linked llir.LLIR, opts compilation.Options, verbose bool) error

	// Return a string to convey relevant dry-run info
	DryRun(ir llir.LLIR, opts compilation.Options, verbose bool) (string, error)

	// Purge any non-run resources that may have been created
	Purge() error

	// List deployed runs
	ListRuns() ([]runs.Run, error)

	// Return a streamer
	Streamer() streamer.Streamer
}
