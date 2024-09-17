//go:build full || observe

package subcommands

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/qstat"
)

func newQlastCommand() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "qlast",
		Short: "Stream queue statistics to console",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
	}

	tgtOpts := options.AddTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		marker := args[0]
		extra := ""
		if len(args) > 1 {
			extra = args[1]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, compilation.Options{Target: tgtOpts})
		if err != nil {
			return err
		}

		val, err := qstat.Qlast(ctx, marker, extra, backend, qstat.QlastOptions{})
		if err != nil {
			return err
		}

		fmt.Println(val)
		return nil
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQlastCommand())
	}
}
