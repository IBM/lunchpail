//NOT YET needed by tests/bin/helpers.sh go:build full || observe

package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/queue"
)

func newQlsCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qls [path]",
		Short: "List queue path",
		Long:  "List queue path",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		path := ""
		if len(args) == 1 {
			path = args[0]
		}
		return queue.Qls(path)
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQlsCmd())
}
