package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/status"
)

func newStatusCommand() *cobra.Command {
	var namespaceFlag string
	var watchFlag bool
	var verboseFlag bool
	var summaryFlag bool
	var loglinesFlag int
	var intervalFlag int

	var cmd = &cobra.Command{
		Use:   "status",
		Short: "Status of a run",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return status.UI(maybeRun, status.Options{namespaceFlag, watchFlag, verboseFlag, summaryFlag, loglinesFlag, intervalFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "Track updates to run status")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Stream more verbose updates to console")
	cmd.Flags().BoolVarP(&summaryFlag, "summary", "s", false, "Show only summary information, do not break out queue stats")

	// max num tracked... we still limit num shown in status/view.go
	cmd.Flags().IntVarP(&loglinesFlag, "log-lines", "l", 500, "Maximum number of log lines to track")

	// interval for polling cpu etc.
	cmd.Flags().IntVarP(&intervalFlag, "interval", "i", 5, "Polling interval in seconds for resource utilization stats")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newStatusCommand())
	}
}
