package subcommands

import (
	"lunchpail.io/cmd/subcommands/shrinkwrap"
)

func init() {
	rootCmd.AddCommand(shrinkwrap.NewAppCmd())
}
