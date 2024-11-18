package worker

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/queue"
)

type Options struct {
	// Run k concurrent tasks; if k=0 and machine has N cores, then k=N
	Pack int

	hlir.CallingConvention
	queue.RunContext
	StartupDelay    int
	PollingInterval int
	build.LogOptions
}
