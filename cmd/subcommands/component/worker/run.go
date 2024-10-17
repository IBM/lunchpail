package worker

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/worker"
)

func Run() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run [-- workerCommand workerCommandArg1 workerCommandArg2 ...]",
		Short: "Run as an application worker",
		Long:  "Run as an application worker",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	var bucket string
	cmd.Flags().StringVar(&bucket, "bucket", "", "Which S3 bucket to use")
	cmd.MarkFlagRequired("bucket")

	var alive string
	cmd.Flags().StringVar(&alive, "alive", "", "Where to place our alive file")
	cmd.MarkFlagRequired("alive")

	var listenPrefix string
	cmd.Flags().StringVar(&listenPrefix, "listen-prefix", "", "Which S3 listen-prefix to use")
	cmd.MarkFlagRequired("listen-prefix")

	var pollingInterval int
	cmd.Flags().IntVar(&pollingInterval, "polling-interval", 3, "If polling is employed, the interval between probes")

	var startupDelay int
	cmd.Flags().IntVar(&startupDelay, "delay", 0, "Delay (in seconds) before engaging in any work")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if len(args) == 0 {
			return fmt.Errorf("Nothing to run. Specify the worker command line after a --: %v", args)
		}

		return worker.Run(context.Background(), args, worker.Options{
			StartupDelay:    startupDelay,
			PollingInterval: pollingInterval,
			LogOptions:      *logOpts,
			Queue: worker.Queue{
				ListenPrefix: listenPrefix,
				Bucket:       bucket,
				Alive:        alive,
			},
		})
	}

	return cmd
}
