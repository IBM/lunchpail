package worker

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
)

type Options struct {
	api.PathArgs
	StartupDelay    int
	PollingInterval int
	build.LogOptions
}
