package ibmcloud

import "lunchpail.io/pkg/ir"

func (backend Backend) Up(linked ir.Linked, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, Create, verbose); err != nil {
		return err
	}

	return nil
}
