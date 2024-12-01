//go:build full || manage

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
)

func init() {
	var cmd = &cobra.Command{
		Use:   "bat",
		Short: "Build and test",
		Long:  "Build and test",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
	}

	buildOpts, err := options.AddBuildOptions(cmd)
	if err != nil {
		panic(err)
	}

	concurrency := 4
	cmd.Flags().IntVarP(&concurrency, "concurrency", "j", concurrency, "Maximum tests to run concurrently")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()

		backend, err := be.NewInitOk(ctx, true, *buildOpts)
		if err != nil {
			return err
		}

		return boot.BuildAndTester{Backend: backend, Concurrency: concurrency, Options: *buildOpts}.RunAll(ctx, args)
	}

	rootCmd.AddCommand(cmd)
}
