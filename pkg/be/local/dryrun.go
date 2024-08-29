package local

import (
	"lunchpail.io/pkg/ir/llir"
)

// Return a string to convey relevant dry-run info
func (backend Backend) DryRun(ir llir.LLIR, opts llir.Options, verbose bool) (string, error) {
	if err := backend.IsCompatible(ir); err != nil {
		return "", err
	}

	return "", nil
}
