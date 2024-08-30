package ir

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

type Linked struct {
	Ir      llir.LLIR
	Options compilation.Options
}
