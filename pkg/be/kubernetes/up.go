package kubernetes

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

func (backend Backend) Up(ctx context.Context, ir llir.LLIR, opts llir.Options, isRunning chan llir.Context) error {
	if ir.Queue().Auto {
		ir.Context = llir.Context{
			Run:   ir.Context.Run,
			Queue: ir.Queue().UpdateEndpoint(fmt.Sprintf("http://%s.%s.svc.cluster.local:%d", util.Dns1035(ir.RunName()+"-minio"), backend.namespace, ir.Queue().Port)),
		}
	}

	if err := applyOperation(ctx, ir, backend.namespace, "", ApplyIt, opts); err != nil {
		return err
	}

	// Indicate that we are off to the races
	if isRunning != nil {
		isRunning <- ir.Context
	}

	return nil
}
