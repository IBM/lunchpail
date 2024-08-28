//go:build full || manage

package kubernetes

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	if err := applyOperation(linked.Ir, linked.Namespace, "", ApplyIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
