package compiler

import "lunchpail.io/pkg/compilation"

type Options struct {
	Name               string
	Branch             string
	Verbose            bool
	AllPlatforms       bool
	CompilationOptions compilation.Options
}
