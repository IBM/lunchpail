package minio

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/minio"
)

func Server() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "server",
		Short: "Run as the minio component",
		Long:  "Run as the minio component",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	var port int
	cmd.Flags().IntVarP(&port, "port", "p", 9000, "Port to use for the Minio api endpoint")

	runOpts := options.AddBucketAndRunOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return minio.Server(context.Background(), port, queue.RunContext{
			Bucket:  runOpts.Bucket,
			RunName: runOpts.Run,
		})
	}

	return cmd
}
