package worker

import "lunchpail.io/pkg/build"

type Queue struct {
	Bucket       string
	ListenPrefix string
	Alive        string
	Dead         string
}

type Options struct {
	Queue
	StartupDelay    int
	PollingInterval int
	build.LogOptions
}
