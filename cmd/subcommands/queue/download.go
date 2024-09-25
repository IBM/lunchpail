package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/queue"
)

func Download() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "download <bucket/path> <localDir>",
		Short: "Copy data out of queue",
		Long:  "Copy data out of queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(2), cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return queue.CopyOut(context.Background(), args[0], args[1])
	}

	return cmd
}
