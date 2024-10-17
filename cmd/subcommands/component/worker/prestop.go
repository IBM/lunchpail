package worker

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/runtime/worker"
)

func PreStop() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "prestop",
		Short: "Mark this worker as dead",
		Long:  "Mark this worker as dead",
	}

	runOpts := options.AddBucketAndRunOptions(cmd)

	var step int
	cmd.Flags().IntVar(&step, "step", 0, "Which step are we part of")
	cmd.MarkFlagRequired("step")

	var poolName string
	cmd.Flags().StringVar(&poolName, "pool", "", "Which worker pool are we part of")
	cmd.MarkFlagRequired("pool")

	var workerName string
	cmd.Flags().StringVar(&workerName, "worker", "", "Which worker are we")
	cmd.MarkFlagRequired("worker")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return worker.PreStop(context.Background(), worker.Options{
			LogOptions: *logOpts,
			PathArgs: api.PathArgs{
				Bucket:     runOpts.Bucket,
				RunName:    runOpts.Run,
				Step:       step,
				PoolName:   poolName,
				WorkerName: workerName,
			},
		})
	}

	return cmd
}
