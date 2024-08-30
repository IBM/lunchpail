package kubernetes

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Down(ir llir.LLIR, copts compilation.Options, cliOpts options.CliOptions, verbose bool) error {
	if err := applyOperation(ir, backend.namespace, "", DeleteIt, cliOpts, verbose); err != nil {
		return err
	}

	return nil
}
