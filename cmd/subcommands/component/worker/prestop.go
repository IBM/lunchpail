package worker

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/worker"
)

func PreStop() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "prestop",
		Short: "Mark this worker as dead",
		Long:  "Mark this worker as dead",
	}

	var step int
	cmd.Flags().IntVar(&step, "step", step, "Which step are we part of")
	cmd.MarkFlagRequired("step")

	var poolName string
	cmd.Flags().StringVar(&poolName, "pool", "", "Which worker pool are we part of")
	cmd.MarkFlagRequired("pool")

	var workerName string
	cmd.Flags().StringVar(&workerName, "worker", "", "Which worker are we")
	cmd.MarkFlagRequired("worker")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		run, err := queue.LoadRunContextInsideComponent("")
		if err != nil {
			return err
		}

		return worker.PreStop(context.Background(), worker.Options{
			LogOptions: *logOpts,
			RunContext: run.ForStep(step).ForPool(poolName).ForWorker(workerName),
		})
	}

	return cmd
}
