package worker

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/worker"
)

func Run() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run [-- workerCommand workerCommandArg1 workerCommandArg2 ...]",
		Short: "Run as an application worker",
		Long:  "Run as an application worker",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	var poolName string
	cmd.Flags().StringVar(&poolName, "pool", "", "Which worker pool are we part of")
	cmd.MarkFlagRequired("pool")

	var workerName string
	cmd.Flags().StringVar(&workerName, "worker", "", "Which worker are we")
	cmd.MarkFlagRequired("worker")

	var pollingInterval int
	cmd.Flags().IntVar(&pollingInterval, "polling-interval", 3, "If polling is employed, the interval between probes")

	var startupDelay int
	cmd.Flags().IntVar(&startupDelay, "delay", 0, "Delay (in seconds) before engaging in any work")

	ccOpts := options.AddCallingConventionOptions(cmd)
	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if len(args) == 0 {
			return fmt.Errorf("Nothing to run. Specify the worker command line after a --: %v", args)
		}

		run, err := queue.LoadRunContextInsideComponent("")
		if err != nil {
			return err
		}

		return worker.Run(context.Background(), args, worker.Options{
			CallingConvention: ccOpts.CallingConvention,
			StartupDelay:      startupDelay,
			PollingInterval:   pollingInterval,
			LogOptions:        *logOpts,
			RunContext:        run.ForPool(poolName).ForWorker(workerName),
		})
	}

	return cmd
}
