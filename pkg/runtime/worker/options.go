package worker

import (
	"time"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/queue"
)

type Options struct {
	// Run k concurrent tasks; if k=0 and machine has N cores, then k=N
	Pack int

	// Gunzip inputs before passing them to the worker logic
	Gunzip bool

	hlir.CallingConvention
	queue.RunContext
	StartupDelay    int
	PollingInterval int
	build.LogOptions
	WorkerStartTime time.Time
}
