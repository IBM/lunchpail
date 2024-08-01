package assembler

import "lunchpail.io/pkg/assembly"

type Options struct {
	Name            string
	Source          string
	Branch          string
	Verbose         bool
	AllPlatforms    bool
	AssemblyOptions assembly.Options
}
