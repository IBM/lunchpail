package kubernetes

import "lunchpail.io/pkg/ir"

func (backend Backend) Down(linked ir.Linked, verbose bool) error {
	if err := applyOperation(linked.Ir, linked.Namespace, "", DeleteIt, verbose); err != nil {
		return err
	}

	return nil
}
