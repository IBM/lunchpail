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

func newQcopyinCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qin <srcDir> <bucket>",
		Short: "Copy data into queue",
		Long:  "Copy data into queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(2), cobra.OnlyValidArgs),
	}

	var runname string
	cmd.Flags().StringVarP(&runname, "run", "r", "", "Inspect the given run, defaulting to using the singleton run")

	tgtOpts := options.AddTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		backend, err := be.New(*tgtOpts, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		return queue.CopyIn(context.Background(), backend, runname, args[0], args[1])
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQcopyinCmd())
	}
}
