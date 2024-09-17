package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) DryRun(ir llir.LLIR, opts llir.Options) (string, error) {
	return "", fmt.Errorf("Unsupported operation: 'DryRun'")
}
