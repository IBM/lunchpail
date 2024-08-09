package worker

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/worker"
)

func NewPreStopCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "prestop",
		Short: "Mark this worker as dead",
		Long:  "Mark this worker as dead",
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return worker.PreStop()
	}

	return cmd
}
