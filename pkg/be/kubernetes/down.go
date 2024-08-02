package kubernetes

import "lunchpail.io/pkg/ir"

func (backend Backend) Down(linked ir.Linked) error {
	if err := ApplyOperation(linked.Ir, linked.Namespace, "", DeleteIt); err != nil {
		return err
	}

	return nil
}
