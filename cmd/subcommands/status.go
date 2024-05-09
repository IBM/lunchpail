package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap/status"
)

func newStatusCommand() *cobra.Command {
	var namespaceFlag string
	var watchFlag bool

	var cmd = &cobra.Command{
		Use:   "status",
		Short: "Status of a run",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return status.UI(maybeRun, status.Options{namespaceFlag, watchFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "Track updates to run status")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newStatusCommand())
	}
}
