package kubernetes

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Down(ctx context.Context, ir llir.LLIR, opts llir.Options) error {
	if err := applyOperation(ctx, ir, backend.namespace, "", DeleteIt, opts); err != nil {
		return err
	}

	return nil
}
