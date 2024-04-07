package subcommands

import (
	"lunchpail.io/cmd/subcommands/shrinkwrap"
	"github.com/spf13/cobra"
)

var shrinkwrapCmd = &cobra.Command{
	Use:   "shrinkwrap",
	Short: "Shrinkwrap either an application or the core",
	Long:  "Shrinkwrap either an application or the core",
}

func init() {
	rootCmd.AddCommand(shrinkwrapCmd)
	shrinkwrapCmd.AddCommand(shrinkwrap.AppCmd)
	shrinkwrapCmd.AddCommand(shrinkwrap.CoreCmd)
}
