package worker

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/worker"
)

func NewPreStopCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "prestop",
		Short: "Mark this worker as dead",
		Long:  "Mark this worker as dead",
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return worker.PreStop(context.Background())
	}

	return cmd
}
