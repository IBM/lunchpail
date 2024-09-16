package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Up(ctx context.Context, ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := backend.SetAction(ctx, opts, ir, Create, verbose); err != nil {
		return err
	}

	return nil
}
