package kubernetes

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	if err := applyOperation(linked.Ir, linked.Namespace, "", DeleteIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
