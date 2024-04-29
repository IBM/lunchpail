package subcommands

import (
	"lunchpail.io/cmd/subcommands/shrinkwrap"
	"lunchpail.io/pkg/lunchpail"
)

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(shrinkwrap.NewAppCmd())
	}
}
