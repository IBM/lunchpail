package kubernetes

import "lunchpail.io/pkg/ir/llir"

func (backend Backend) Down(ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := applyOperation(ir, backend.namespace, "", DeleteIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
