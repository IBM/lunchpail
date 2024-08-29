//go:build full || manage

package kubernetes

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Down(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := applyOperation(linked.Ir, backend.namespace, "", DeleteIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
