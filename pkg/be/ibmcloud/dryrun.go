//go:build full || manage

package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) DryRun(ir llir.LLIR, cliOpts options.CliOptions, verbose bool) (string, error) {
	return "", fmt.Errorf("Unsupported operation: 'DryRun'")
}
