//go:build full || observe

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/status"
)

func newStatusCommand() *cobra.Command {
	var watchFlag bool
	var summaryFlag bool
	var loglinesFlag int
	var intervalFlag int

	var cmd = &cobra.Command{
		Use:   "status",
		Short: "Status of a run",
	}

	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "Track updates to run status")
	cmd.Flags().BoolVarP(&summaryFlag, "summary", "s", false, "Show only summary information, do not break out queue stats")

	// max num tracked... we still limit num shown in status/view.go
	cmd.Flags().IntVarP(&loglinesFlag, "log-lines", "l", 500, "Maximum number of log lines to track")

	// interval for polling cpu etc.
	cmd.Flags().IntVarP(&intervalFlag, "interval", "i", 5, "Polling interval in seconds for resource utilization stats")

	opts, err := options.RestoreCompilationOptions()
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

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newStatusCommand())
	}
}
