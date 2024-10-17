package worker

import "lunchpail.io/pkg/build"

type Options struct {
	Bucket string
	Alive  string
	Dead   string
	build.LogOptions
}
