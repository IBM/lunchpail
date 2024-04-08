package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/cmd/subcommands/shrinkwrap"
)

var shrinkwrapCmd = &cobra.Command{
	Use:   "shrinkwrap",
	Short: "Shrinkwrap either an application or the core",
	Long:  "Shrinkwrap either an application or the core",
}

func init() {
	rootCmd.AddCommand(shrinkwrapCmd)
	shrinkwrapCmd.AddCommand(shrinkwrap.NewAppCmd())
	shrinkwrapCmd.AddCommand(shrinkwrap.NewCoreCmd())
}
