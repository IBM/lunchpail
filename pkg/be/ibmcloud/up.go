package ibmcloud

import "lunchpail.io/pkg/ir/llir"

func (backend Backend) Up(ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := backend.SetAction(opts, ir, Create, verbose); err != nil {
		return err
	}

	return nil
}
