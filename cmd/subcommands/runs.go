//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/runs"
	"lunchpail.io/pkg/compilation"
)

func init() {
	if compilation.IsCompiled() {
		cmd := &cobra.Command{
			Use:   "runs",
			Short: "Commands related to runs",
		}

		rootCmd.AddCommand(cmd)
		cmd.AddCommand(runs.List())
		cmd.AddCommand(runs.Instances())
	}
}
