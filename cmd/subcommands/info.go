package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/info"
)

func newInfoCommand() *cobra.Command {
	var namespaceFlag string
	var followFlag bool

	var cmd = &cobra.Command{
		Use:   "info",
		Short: "Summary information of the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return info.UI(info.Options{namespaceFlag, followFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Track updates to the application state")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newInfoCommand())
	}
}
