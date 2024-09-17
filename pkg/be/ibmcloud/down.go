package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Down(ctx context.Context, ir llir.LLIR, opts llir.Options) error {
	if err := backend.SetAction(ctx, opts, ir, Delete); err != nil {
		return err
	}

	return nil
}

func (backend Backend) Purge(ctx context.Context) error {
	// Is there anything to do here?
	return nil
}
