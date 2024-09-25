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

func newQlsCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "qls [path]",
		Short: "List queue path",
		Long:  "List queue path",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	opts, err := options.RestoreCompilationOptions()
	if err != nil {
		panic(err)
	}

	runOpts := options.AddRunOptions(cmd)
	options.AddTargetOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		path := ""
		if len(args) == 1 {
			path = args[0]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		return queue.Qls(ctx, backend, runOpts.Run, path)
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQlsCmd())
	}
}
