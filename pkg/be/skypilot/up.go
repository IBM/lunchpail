package skypilot

import "lunchpail.io/pkg/ir"

func (backend Backend) Up(linked ir.Linked) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, Launch); err != nil {
		return err
	}

	return nil
}
