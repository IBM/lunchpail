//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/runs"
	"lunchpail.io/pkg/build"
)

func init() {
	if build.IsBuilt() {
		cmd := &cobra.Command{
			Use:   "runs",
			Short: "Commands related to runs",
		}

		rootCmd.AddCommand(cmd)
		cmd.AddCommand(runs.Status())
		cmd.AddCommand(runs.List())
		cmd.AddCommand(runs.Instances())
		cmd.AddCommand(runs.Cpu())
	}
}
