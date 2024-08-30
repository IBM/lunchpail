package ibmcloud

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, Create, opts, verbose); err != nil {
		return err
	}

	return nil
}
