package builder

import "lunchpail.io/pkg/build"

type Options struct {
	Name         string
	Branch       string
	AllPlatforms bool
	BuildOptions build.Options

	// Run the given command line
	Command string
}
