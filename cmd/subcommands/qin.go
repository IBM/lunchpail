package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/workstealer"
)

func newQcopyinCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qin <srcDir> <bucket>",
		Short: "Copy data into queue",
		Long:  "Copy data into queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(2), cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return workstealer.CopyIn(args[0], args[1])
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQcopyinCmd())
}
