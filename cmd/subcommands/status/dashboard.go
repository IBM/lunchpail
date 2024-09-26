//go:build full || observe

package runs

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/status"
)

func Dashboard() *cobra.Command {
	var watchFlag bool
	var summaryFlag bool
	var loglinesFlag int
	var intervalFlag int

	var cmd = &cobra.Command{
		Use:   "dashboard",
		Short: "Show a console-based dashboard for a run",
	}

	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "Track updates to run status")
	cmd.Flags().BoolVarP(&summaryFlag, "summary", "s", false, "Show only summary information, do not break out queue stats")

	// max num tracked... we still limit num shown in status/view.go
	cmd.Flags().IntVarP(&loglinesFlag, "log-lines", "l", 500, "Maximum number of log lines to track")

	// interval for polling cpu etc.
	cmd.Flags().IntVarP(&intervalFlag, "interval", "i", 5, "Polling interval in seconds for resource utilization stats")

	opts, err := options.RestoreBuildOptions()
	if err != nil {
		panic(err)
	}

	options.AddTargetOptionsTo(cmd, &opts)
	options.AddLogOptionsTo(cmd, &opts)

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

		return status.UI(ctx, maybeRun, backend, status.Options{Watch: watchFlag, Verbose: opts.Log.Verbose, Summary: summaryFlag, Nloglines: loglinesFlag, IntervalSeconds: intervalFlag})
	}

	return cmd
}
