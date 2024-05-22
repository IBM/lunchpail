package subcommands

import (
	"lunchpail.io/pkg/fe/app"
	"lunchpail.io/pkg/lunchpail"

	"github.com/spf13/cobra"
)

func newDownCmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "down",
		Short: "Undeploy the application",
		Long:  "Undeploy the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return app.Down(maybeRun, app.DownOptions{namespaceFlag, verboseFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Vebose output")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newDownCmd())
	}
}
