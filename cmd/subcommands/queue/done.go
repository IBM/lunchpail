package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/queue"
)

func Done() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "done",
		Short: "Indicate that dispatching is done",
		Long:  "Indicate that dispatching is done",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}
	logOpts := options.AddLogOptions(cmd)
	runOpts := options.AddRequiredRunOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return queue.Qdone(context.Background(), runOpts.Run, *logOpts)
	}

	return cmd
}
