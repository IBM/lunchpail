//go:build full || observe

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
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

	opts, err := options.RestoreCompilationOptions()
	if err != nil {
		return nil
	}

	runOpts := options.AddRunOptions(cmd)
	options.AddTargetOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		return queue.Qcat(ctx, backend, runOpts.Run, args[0])
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQcatCmd())
	}
}
