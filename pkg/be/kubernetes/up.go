package kubernetes

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ir llir.LLIR, opts compilation.Options, verbose bool) error {
	if err := applyOperation(ir, backend.namespace, "", ApplyIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
