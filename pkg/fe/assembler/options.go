package assembler

import "lunchpail.io/pkg/assembly"

type Options struct {
	Name            string
	Branch          string
	Verbose         bool
	AssemblyOptions assembly.Options
}
