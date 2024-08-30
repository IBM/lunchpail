package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) DryRun(ir llir.LLIR, opts llir.Options, verbose bool) (string, error) {
	return "", fmt.Errorf("Unsupported operation: 'DryRun'")
}
