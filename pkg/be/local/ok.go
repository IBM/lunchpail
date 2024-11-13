package local

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
)

// Is the backend ready for `up`?
func (backend Backend) Ok(ctx context.Context, initOk bool, opts build.Options) error {
	return nil
}

// Is the given IR compatible with this backend?
func (backend Backend) IsCompatible(ir llir.LLIR) error {
	if ir.AppProvidedKubernetesResources != "" {
		return fmt.Errorf("Unable to target the local backend due to application-provided Kubernetes resources")
	}

	for _, c := range ir.Components {
		switch cc := c.(type) {
		case llir.ShellComponent:
			if err := shell.IsCompatible(cc); err != nil {
				return err
			}
		default:
			return fmt.Errorf("Unable to target a non-shell component '%v' to the local backend", c.C())
		}
	}

	return nil
}
