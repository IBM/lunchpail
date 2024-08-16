//NOT YET needed by tests/bin/helpers.sh go:build full || observe

package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/queue"
)

func newQcatCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qcat <file>",
		Short: "Show the contents of a file in the queue",
		Long:  "Show the contents of a file in the queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return queue.Qcat(args[0])
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQcatCmd())
}
