//go:build full || deploy

package subcommands

import (
	"context"
	"os"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/util"
)

func newUpCmd() *cobra.Command {
	var dryrunFlag bool
	watchFlag := false
	var createCluster bool

	var cmd = &cobra.Command{
		Use:     "up [inputFilesOrDirectories...]",
		GroupID: applicationGroup.ID,
		Short:   "Deploy the application",
		Long:    "Deploy the application",
		Args:    cobra.MatchAll(cobra.OnlyValidArgs),
	}

	if util.StdoutIsTty() {
		// default to watch if we are connected to a TTY
		watchFlag = true
	}

	cmd.Flags().SortFlags = false
	buildOpts, err := options.AddBuildOptions(cmd)
	if err != nil {
		panic(err)
	}

	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", watchFlag, "After deployment, watch for status updates")
	cmd.Flags().BoolVarP(&createCluster, "create-cluster", "I", false, "Create a new (local) Kubernetes cluster, if needed")

	var noRedirect bool
	cmd.Flags().BoolVar(&noRedirect, "no-redirect", false, "Never download output to client")

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
		// value 4, so we need to place the built options
		// first in the list
		buildOpts.OverrideValues = append(buildOpts.OverrideValues, overrideValues...)
		buildOpts.OverrideFileValues = append(buildOpts.OverrideFileValues, overrideFileValues...)

		ctx := context.Background()
		backend, err := be.NewInitOk(ctx, createCluster, *buildOpts)
		if err != nil {
			return err
		}

		_, err = boot.Up(ctx, backend, boot.UpOptions{BuildOptions: *buildOpts, DryRun: dryrunFlag, Watch: watchFlag, WatchUtil: watchFlag, Inputs: args, Executable: os.Args[0], NoRedirect: noRedirect})
		return err
	}

	return cmd
}

func init() {
	if build.IsBuilt() {
		rootCmd.AddCommand(newUpCmd())
	}
}
