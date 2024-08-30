package ibmcloud

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ir llir.LLIR, copts compilation.Options, verbose bool) error {
	if err := backend.SetAction(copts, ir, Create, verbose); err != nil {
		return err
	}

	return nil
}
