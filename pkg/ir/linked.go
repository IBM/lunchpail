package ir

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

type Linked struct {
	Runname         string
	Namespace       string
	Ir              llir.LLIR
	Options         compilation.Options
	DeleteResources bool
}
