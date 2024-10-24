package worker

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/queue"
)

type Options struct {
	hlir.CallingConvention
	queue.RunContext
	StartupDelay    int
	PollingInterval int
	build.LogOptions
}
