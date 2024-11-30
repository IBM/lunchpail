//go:build full || manage

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/target"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/build"
)

func init() {
	if build.IsBuilt() && build.HasTestData() {
		var cmd = &cobra.Command{
			Use:   "test",
			Short: "Run stock tests",
			Long:  "Run stock tests",
		}

		buildOpts, err := options.AddBuildOptions(cmd)
		if err != nil {
			panic(err)
		}

		cmd.RunE = func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()

			buildOpts.Target.Platform = target.Local
			backend, err := be.New(ctx, *buildOpts)
			if err != nil {
				return err
			}

			return boot.Tester{Backend: backend, Options: *buildOpts}.RunAll(ctx)
		}

		rootCmd.AddCommand(cmd)
	}
}
