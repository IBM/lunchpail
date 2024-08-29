//go:build full || manage

package ibmcloud

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, linked.Namespace, Create, opts, verbose); err != nil {
		return err
	}

	return nil
}
