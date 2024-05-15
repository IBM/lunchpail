package assembler

import (
	"lunchpail.io/pkg/lunchpail"
)

type Options struct {
	Name       string
	Branch     string
	Verbose    bool
	AppOptions lunchpail.AppOptions
}
