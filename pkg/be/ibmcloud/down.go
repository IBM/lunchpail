package ibmcloud

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	if err := backend.SetAction(linked.Options, linked.Ir, linked.Runname, linked.Namespace, Delete, opts, verbose); err != nil {
		return err
	}

	return nil
}

func (backend Backend) DeleteNamespace(compilationName string) error {
	// TODO?
	return nil
}
