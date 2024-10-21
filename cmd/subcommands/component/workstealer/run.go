package workstealer

import (
	"context"
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/workstealer"
)

func Run() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run",
		Short: "Run a work stealer",
		Long:  "Run a work stealer",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	var pollingInterval int
	cmd.Flags().IntVar(&pollingInterval, "polling-interval", 3, "If polling is employed, the interval between probes")

	lopts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		run, err := queue.LoadRunContextInsideComponent("")
		if err != nil {
			return err
		}

		return workstealer.Run(context.Background(), run, workstealer.Options{PollingInterval: pollingInterval, LogOptions: *lopts})
	}

	return cmd
}
