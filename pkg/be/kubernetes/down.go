package kubernetes

import (
	"context"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) Down(ctx context.Context, ir llir.LLIR, opts llir.Options, verbose bool) error {
	if err := applyOperation(ctx, ir, backend.namespace, "", DeleteIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
