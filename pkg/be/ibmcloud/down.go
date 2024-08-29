//go:build full || manage

package ibmcloud

import (
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Down(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, linked.Namespace, Delete, opts, verbose); err != nil {
		return err
	}

	return nil
}

func (backend Backend) DeleteNamespace(compilationName string) error {
	// TODO?
	return nil
}
