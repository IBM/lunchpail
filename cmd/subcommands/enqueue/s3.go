package enqueue

import (
	"os"

	"github.com/spf13/cobra"

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
	cmd.Flags().IntVarP(&repeat, "repeat", "r", 1, "Upload N copies of the task")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		envvarPrefix := args[1]
		endpoint := os.Getenv(envvarPrefix + "endpoint")
		accessKeyID := os.Getenv(envvarPrefix + "accessKeyID")
		secretAccessKey := os.Getenv(envvarPrefix + "secretAccessKey")
		return queue.EnqueueFromS3(args[0], endpoint, accessKeyID, secretAccessKey, repeat)
	}

	return cmd
}
