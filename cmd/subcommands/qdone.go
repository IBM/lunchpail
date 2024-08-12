package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/workstealer"
)

func newQdoneCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qdone",
		Short: "Indicate that dispatching is done",
		Long:  "Indicate that dispatching is done",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return workstealer.Qdone()
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQdoneCmd())
}
