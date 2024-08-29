//go:build full || manage

package kubernetes

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := applyOperation(linked.Ir, backend.namespace, "", ApplyIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
