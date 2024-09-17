package enqueue

import (
	"context"
	"os"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/queue"
)

func NewEnqueueFromS3Cmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "s3 <path> <envVarPrefix>",
		Short: "Enqueue a files in a given S3 path",
		Long:  "Enqueue a files in a given S3 path",
		Args:  cobra.MatchAll(cobra.ExactArgs(2), cobra.OnlyValidArgs),
	}

	var repeat int
	var opts queue.EnqueueS3Options
	cmd.Flags().IntVarP(&repeat, "repeat", "r", 1, "Upload N copies of the task")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		envvarPrefix := args[1]
		endpoint := os.Getenv(envvarPrefix + "endpoint")
		accessKeyID := os.Getenv(envvarPrefix + "accessKeyID")
		secretAccessKey := os.Getenv(envvarPrefix + "secretAccessKey")
		opts.Verbose = logOpts.Verbose
		opts.Debug = logOpts.Debug
		return queue.EnqueueFromS3(context.Background(), args[0], endpoint, accessKeyID, secretAccessKey, repeat, opts)
	}

	return cmd
}
