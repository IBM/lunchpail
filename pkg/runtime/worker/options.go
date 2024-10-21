package worker

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

type Options struct {
	queue.RunContext
	StartupDelay    int
	PollingInterval int
	build.LogOptions
}
