package worker

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/worker"
)

func NewRunCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run [-- workerCommand workerCommandArg1 workerCommandArg2 ...]",
		Short: "Run as an application worker",
		Long:  "Run as an application worker",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	var debug bool
	cmd.Flags().BoolVarP(&debug, "debug", "g", false, "Run in debug mode, which will emit extra log information")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if len(args) == 0 {
			return fmt.Errorf("Nothing to run. Specify the worker command line after a --: %v", args)
		}

		return worker.Run(context.Background(), args, worker.Options{Debug: debug})
	}

	return cmd
}
