package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) DryRun(ir llir.LLIR, opts compilation.Options, verbose bool) (string, error) {
	return "", fmt.Errorf("Unsupported operation: 'DryRun'")
}
