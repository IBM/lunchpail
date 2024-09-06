//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/run"
	"lunchpail.io/pkg/compilation"
)

func init() {
	if compilation.IsCompiled() {
		cmd := &cobra.Command{
			Use:   "run",
			Short: "Commands related to runs",
		}

		rootCmd.AddCommand(cmd)
		cmd.AddCommand(run.List())
		cmd.AddCommand(run.Instances())
	}
}
