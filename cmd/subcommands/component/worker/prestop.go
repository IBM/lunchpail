package worker

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/worker"
)

func PreStop() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "prestop",
		Short: "Mark this worker as dead",
		Long:  "Mark this worker as dead",
	}

	bucket := ""
	cmd.Flags().StringVar(&bucket, "bucket", "", "Which S3 bucket to use")
	cmd.MarkFlagRequired("bucket")

	alive := ""
	cmd.Flags().StringVar(&alive, "alive", "", "Where to place our alive file")
	cmd.MarkFlagRequired("alive")

	dead := ""
	cmd.Flags().StringVar(&dead, "dead", "", "Where to place our dead file")
	cmd.MarkFlagRequired("dead")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return worker.PreStop(context.Background(), worker.Options{
			LogOptions: *logOpts,
			Queue: worker.Queue{
				Bucket: bucket,
				Dead:   dead,
			},
		})
	}

	return cmd
}
