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

	var runname string
	cmd.Flags().StringVarP(&runname, "run", "r", "", "Inspect the given run, defaulting to using the singleton run")

	tgtOpts := options.AddTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		backend, err := be.New(*tgtOpts, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		return queue.Qcat(context.Background(), backend, runname, args[0])
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQcatCmd())
	}
}
