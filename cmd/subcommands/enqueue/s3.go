package enqueue

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/workstealer"
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
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		envvarPrefix := args[1]
		endpoint := os.Getenv(envvarPrefix + "endpoint")
		accessKeyID := os.Getenv(envvarPrefix + "accessKeyID")
		secretAccessKey := os.Getenv(envvarPrefix + "secretAccessKey")
		return workstealer.EnqueueFromS3(args[0], endpoint, accessKeyID, secretAccessKey, repeat)
	}

	return cmd
}
