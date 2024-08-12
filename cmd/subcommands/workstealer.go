package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/workstealer"
)

func newWorkstealerCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "workstealer",
		Short: "Run a work stealer",
		Long:  "Run a work stealer",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return workstealer.Run()
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newWorkstealerCmd())
}
