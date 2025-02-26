//go:build full || observe

package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	q "lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/queue"
)

func Cat() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "cat <file>",
		Short: "Show the contents of a file in the queue",
		Long:  "Show the contents of a file in the queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
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

		return queue.Qcat(ctx, backend, run, args[0], q.Spec{}, *opts.Log)
	}

	return cmd
}
