package kubernetes

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ir llir.LLIR, copts compilation.Options, cliOpts options.CliOptions, verbose bool) error {
	if err := applyOperation(ir, backend.namespace, "", ApplyIt, cliOpts, verbose); err != nil {
		return err
	}

	return nil
}
