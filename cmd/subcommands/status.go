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
			Use:     "status",
			GroupID: runGroup.ID,
			Short:   "Commands related to the status of a run",
		}

		rootCmd.AddCommand(cmd)
		cmd.AddCommand(runs.ListRuns())
		cmd.AddCommand(runs.Instances())
		cmd.AddCommand(runs.Cpu())
	}
}
