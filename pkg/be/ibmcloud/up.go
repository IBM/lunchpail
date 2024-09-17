package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ctx context.Context, ir llir.LLIR, opts llir.Options) error {
	if err := backend.SetAction(ctx, opts, ir, Create); err != nil {
		return err
	}

	return nil
}
