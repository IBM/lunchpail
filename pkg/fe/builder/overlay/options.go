package overlay

import "lunchpail.io/pkg/build"

type Options struct {
	BuildOptions build.Options
	Branch       string
	Command      string
	SourceIsYaml bool
}

func (opts Options) Verbose() bool {
	return opts.BuildOptions.Verbose()
}
