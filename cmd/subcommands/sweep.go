//go:build full || deploy

package subcommands

import (
	"context"
	"strconv"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/runtime/builtins/sweep"
)

func init() {
	cmd := &cobra.Command{
		Use:     "sweep min max [step]",
		GroupID: dataGroup.ID,
		Short:   "Sweep a space of integers",
		Args:    cobra.MatchAll(cobra.MinimumNArgs(2), cobra.MaximumNArgs(3), cobra.OnlyValidArgs),
	}

	var wait bool
	cmd.Flags().BoolVar(&wait, "wait", wait, "Wait for parameter to be processed before proceeding to the next")

	var intervalSeconds int
	cmd.Flags().IntVar(&intervalSeconds, "interval", 5, "Seconds between injection of a parameter value")

	var createCluster bool
	cmd.Flags().BoolVarP(&createCluster, "create-cluster", "I", false, "Create a new (local) Kubernetes cluster, if needed")

	buildOpts, err := options.AddBuildOptions(cmd)
	if err != nil {
		panic(err)
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.NewInitOk(ctx, createCluster, *buildOpts)
		if err != nil {
			return err
		}

		min, err := strconv.Atoi(args[0])
		if err != nil {
			return err
		}

		max, err := strconv.Atoi(args[1])
		if err != nil {
			return err
		}

		step := 1
		if len(args) == 3 {
			step, err = strconv.Atoi(args[2])
			if err != nil {
				return err
			}
		}

		return boot.UpHLIR(ctx, backend, sweep.App(min, max, step, intervalSeconds, wait, *buildOpts), boot.UpOptions{BuildOptions: *buildOpts})
	}

	rootCmd.AddCommand(cmd)
}
