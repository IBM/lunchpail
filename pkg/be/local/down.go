package local

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

// Bring down the linked application
func (backend Backend) Down(ctx context.Context, ir llir.LLIR, opts llir.Options) error {
	if err := backend.IsCompatible(ir); err != nil {
		return err
	}

	return nil
}
