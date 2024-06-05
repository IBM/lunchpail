package skypilot

import "lunchpail.io/pkg/ir"

func (backend Backend) Down(linked ir.Linked) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, Down); err != nil {
		return err
	}

	return nil
}

func (backend Backend) DeleteNamespace(compilationName, namespace string) error {
	// TODO?
	return nil
}
