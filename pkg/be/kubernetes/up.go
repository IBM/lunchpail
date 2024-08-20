package kubernetes

import "lunchpail.io/pkg/ir"

func (backend Backend) Up(linked ir.Linked, verbose bool) error {
	if err := applyOperation(linked.Ir, linked.Namespace, "", ApplyIt, verbose); err != nil {
		return err
	}

	return nil
}
