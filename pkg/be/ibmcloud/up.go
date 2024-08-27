package ibmcloud

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, linked.Namespace, Create, opts, verbose); err != nil {
		return err
	}

	return nil
}
