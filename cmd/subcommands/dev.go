//go:build full || build || manage

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/dev"
)

func init() {
	var cmd = &cobra.Command{
		Use:     "dev",
		GroupID: internalGroup.ID,
		Short:   "Commands related to local Lunchpail development",
		Long:    "Commands related to local Lunchpail development",
	}

	cmd.AddCommand(dev.Init())
	cmd.AddCommand(dev.Build())

	rootCmd.AddCommand(cmd)
}
