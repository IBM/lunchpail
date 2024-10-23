//go:build full || deploy

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/runtime/builtins"
)

func initBuiltin(appFn func() hlir.HLIR, use string, short string) {
	cmd := &cobra.Command{
		Use:     use,
		GroupID: dataGroup.ID,
		Short:   short,
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

		return boot.UpHLIR(ctx, backend, appFn(), boot.UpOptions{BuildOptions: *buildOpts, Inputs: args})
	}

	rootCmd.AddCommand(cmd)
}

func init() {
	initBuiltin(builtins.CatApp, "cat [input1 input2 ...]", "Inject one or more files into a pipeline execution")
	initBuiltin(builtins.Add1App, "add1 [input1 input2 ...]", "Increment the content of each file by 1")
}
