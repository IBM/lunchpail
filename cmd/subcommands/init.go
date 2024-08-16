//go:build full || compile || manage

package subcommands

import (
	"github.com/spf13/cobra"
	initialize "lunchpail.io/cmd/subcommands/init"
)

func newInitCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "init",
		Short: "Initialize a control plane",
		Long:  "Initialize a control plane",
	}

	cmd.AddCommand(initialize.NewInitLocalCmd())

	return cmd
}

func init() {
	rootCmd.AddCommand(newInitCmd())
}
