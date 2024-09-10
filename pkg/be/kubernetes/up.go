package kubernetes

import (
	"fmt"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

func (backend Backend) Up(ir llir.LLIR, opts llir.Options, verbose bool) error {
	ir.Queue = ir.Queue.UpdateEndpoint(fmt.Sprintf("http://%s.%s.svc.cluster.local:%d", util.Dns1035(ir.RunName+"-minio"), backend.namespace, ir.Queue.Port))

	if err := applyOperation(ir, backend.namespace, "", ApplyIt, opts, verbose); err != nil {
		return err
	}

	return nil
}
