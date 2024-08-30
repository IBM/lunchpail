package ibmcloud

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Down(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, Delete, opts, verbose); err != nil {
		return err
	}

	return nil
}

func (backend Backend) Purge() error {
	// Is there anything to do here?
	return nil
}
