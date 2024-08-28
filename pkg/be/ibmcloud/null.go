//go:build !full && !manage

package ibmcloud

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir"
)

func (backend Backend) Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) DeleteNamespace(compilationName string) error {
	// TODO?
	return nil
}
