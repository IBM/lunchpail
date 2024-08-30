package ibmcloud

import "lunchpail.io/pkg/ir/llir"

func (backend Backend) Down(ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := backend.SetAction(opts, ir, Delete, verbose); err != nil {
		return err
	}

	return nil
}

func (backend Backend) Purge() error {
	// Is there anything to do here?
	return nil
}
