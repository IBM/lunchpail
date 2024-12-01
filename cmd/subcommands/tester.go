//go:build full || manage

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
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

		quiet := false
		cmd.Flags().BoolVarP(&quiet, "quiet", "q", quiet, "Do not show stdout of application being tested")

		cmd.RunE = func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()

			buildOpts.CreateNamespace = true
			backend, err := be.NewInitOk(ctx, true, *buildOpts)
			if err != nil {
				return err
			}

			return boot.Tester{Quiet: quiet, Backend: backend, Options: *buildOpts}.RunAll(ctx)
		}

		rootCmd.AddCommand(cmd)
	}
}
