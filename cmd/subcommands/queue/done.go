package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	q "lunchpail.io/pkg/ir/queue"
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

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		run, err := q.LoadRunContextInsideComponent("")
		if err != nil {
			return err
		}

		return queue.Qdone(context.Background(), run, *logOpts)
	}

	return cmd
}
