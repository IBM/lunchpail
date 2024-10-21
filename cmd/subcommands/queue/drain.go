//go:build full || deploy

package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	q "lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/queue"
)

func Drain() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "drain",
		Short: "Drain the output tasks, allowing graceful termination",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	opts, err := options.RestoreBuildOptions()
	if err != nil {
		panic(err)
	}

	runOpts := options.AddRunOptions(cmd)
	options.AddTargetOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		run, err := q.LoadRunContextInsideComponent(runOpts.Run)
		if err != nil {
			return err
		}

		return queue.Drain(ctx, backend, run)
	}

	return cmd
}
