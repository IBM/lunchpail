//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/status"
	"lunchpail.io/pkg/build"
)

func init() {
	if build.IsBuilt() {
		cmd := &cobra.Command{
			Use:   "status",
			Short: "Commands related to run status",
		}

		rootCmd.AddCommand(cmd)
		cmd.AddCommand(runs.Dashboard())
		cmd.AddCommand(runs.ListRuns())
		cmd.AddCommand(runs.Instances())
		cmd.AddCommand(runs.Cpu())
	}
}
