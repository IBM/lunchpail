package worker

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/worker"
)

func NewRunCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run [-- workerCommand workerCommandArg1 workerCommandArg2 ...]",
		Short: "Run as an application worker",
		Long:  "Run as an application worker",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		if len(args) == 0 {
			return fmt.Errorf("Nothing to run. Specify the worker command line after a --: %v", args)
		}

		return worker.Run(args, worker.Options{})
	}

	return cmd
}
