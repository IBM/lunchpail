package be

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok() error

	// Bring up the linked application
	Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Bring down the linked application
	Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Delete namespace
	DeleteNamespace(compilationName string) error

	// List deployed runs
	ListRuns(appName string) ([]runs.Run, error)

	// Return a streamer
	Streamer() streamer.Streamer
}
