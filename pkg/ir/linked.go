package ir

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/ir/llir"
)

type Linked struct {
	Runname   string
	Namespace string
	Ir        llir.LLIR
	Options   assembly.Options
}
