package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/queue"
)

func newQdoneCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qdone",
		Short: "Indicate that dispatching is done",
		Long:  "Indicate that dispatching is done",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return queue.Qdone()
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newQdoneCmd())
}
