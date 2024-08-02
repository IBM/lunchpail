package kubernetes

import "lunchpail.io/pkg/ir"

func (backend Backend) Up(linked ir.Linked) error {
	if err := ApplyOperation(linked.Ir, linked.Namespace, "", ApplyIt); err != nil {
		return err
	}

	return nil
}
