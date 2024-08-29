package local

import (
	"lunchpail.io/pkg/ir/llir"
)

// Bring down the linked application
func (backend Backend) Down(ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := backend.IsCompatible(ir); err != nil {
		return err
	}

	return nil
}
