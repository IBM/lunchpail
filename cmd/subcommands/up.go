//go:build full || deploy

package subcommands

import (
	"context"
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/util"
)

func newUpCmd() *cobra.Command {
	var verboseFlag bool
	var dryrunFlag bool
	watchFlag := false
	var createCluster bool

	var cmd = &cobra.Command{
		Use:   "up",
		Short: "Deploy the application",
		Long:  "Deploy the application",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	if util.StdoutIsTty() {
		// default to watch if we are connected to a TTY
		watchFlag = true
	}

	cmd.Flags().SortFlags = false
	compilationOpts, err := options.AddCompilationOptions(cmd)
	if err != nil {
		panic(err)
	}

	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", watchFlag, "After deployment, watch for status updates")
	cmd.Flags().BoolVarP(&createCluster, "create-cluster", "I", false, "Create a new (local) Kubernetes cluster, if needed")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}
		overrideFileValues, err := cmd.Flags().GetStringSlice("set-file")
		if err != nil {
			return err
		}

		// careful: `--set x=3 --set x=4` results in x having
		// value 4, so we need to place the compiled options
		// first in the list
		compilationOpts.OverrideValues = append(compilationOpts.OverrideValues, overrideValues...)
		compilationOpts.OverrideFileValues = append(compilationOpts.OverrideFileValues, overrideFileValues...)

		configureOptions := linker.ConfigureOptions{CompilationOptions: *compilationOpts, Verbose: verboseFlag}

		ctx := context.Background()
		backend, err := be.NewInitOk(ctx, createCluster, *compilationOpts)
		if err != nil {
			return err
		}

		return boot.Up(ctx, backend, boot.UpOptions{ConfigureOptions: configureOptions, DryRun: dryrunFlag, Watch: watchFlag})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newUpCmd())
	}
}
