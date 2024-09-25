//go:build full || manage || observe

package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/observe/info"
)

func newInfoCommand() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "info",
		Short: "Summary information of the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return info.UI()
		},
	}

	return cmd
}

func init() {
	if build.IsBuilt() {
		rootCmd.AddCommand(newInfoCommand())
	}
}
