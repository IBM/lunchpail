package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/workstealer"
)

func newQlsCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qls <path>",
		Short: "List queue path",
		Long:  "List queue path",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return workstealer.Qls(args[0])
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQlsCmd())
}
