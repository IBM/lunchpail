package ibmcloud

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ir llir.LLIR, copts compilation.Options, opts options.CliOptions, verbose bool) error {
	if err := backend.SetAction(copts, ir, Create, opts, verbose); err != nil {
		return err
	}

	return nil
}
