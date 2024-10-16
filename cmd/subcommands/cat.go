//go:build full || deploy

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/runtime/builtins"
)

func init() {
	cmd := &cobra.Command{
		Use:     "cat input1 [input2 ...]",
		GroupID: dataGroup.ID,
		Short:   "Inject one or more files into a pipeline execution",
		Args:    cobra.MatchAll(cobra.OnlyValidArgs),
	}

	buildOpts, err := options.AddBuildOptions(cmd)
	if err != nil {
		panic(err)
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.NewInitOk(ctx, true, *buildOpts)
		if err != nil {
			return err
		}

		return boot.UpHLIR(ctx, backend, builtins.CatApp(), boot.UpOptions{BuildOptions: *buildOpts, Inputs: args})
	}

	rootCmd.AddCommand(cmd)
}
