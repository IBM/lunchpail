//go:build full || observe

package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/qstat"
	"lunchpail.io/pkg/observe/queuestreamer"
)

func Stat() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "stat",
		Short: "Stream queue statistics to console",
	}

	var followFlag bool
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", true, "Track updates (rather than printing once)")

	var debounce int
	cmd.Flags().IntVarP(&debounce, "debounce", "d", 10, "Debounce output with this granularity in milliseconds")

	opts, err := options.RestoreBuildOptions()
	if err != nil {
		panic(err)
	}

	options.AddTargetOptionsTo(cmd, &opts)
	logOpts := options.AddLogOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		return qstat.UI(ctx, maybeRun, backend, qstat.Options{Follow: followFlag, Debounce: debounce, StreamOptions: queuestreamer.StreamOptions{PollingInterval: 3, LogOptions: *logOpts}})
	}

	return cmd
}
