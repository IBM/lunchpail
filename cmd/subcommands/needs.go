package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/needs"
)

func init() {
	var cmd = &cobra.Command{
		Use:     "needs",
		GroupID: internalGroup.ID,
		Short:   "Commands for installing dependencies to run the application",
		Long:    "Commands for installing dependencies to run the application",
	}

	rootCmd.AddCommand(cmd)
	cmd.AddCommand(needs.Minio())
	cmd.AddCommand(needs.Python())
}
