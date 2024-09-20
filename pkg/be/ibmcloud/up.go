package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ctx context.Context, ir llir.LLIR, opts llir.Options, isRunning chan struct{}) error {
	if err := backend.SetAction(ctx, opts, ir, Create); err != nil {
		return err
	}

	// Indicate that we are off to the races
	isRunning <- struct{}{}

	return nil
}
