//go:build full || observe

package queue

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	q "lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/runtime/queue/upload"
)

func Upload() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "upload <srcDir> <bucket>",
		Short: "Copy data into queue",
		Long:  "Copy data into queue",
		Args:  cobra.MatchAll(cobra.ExactArgs(2), cobra.OnlyValidArgs),
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

		run := q.RunContext{RunName: runOpts.Run}
		return queue.UploadFiles(ctx, backend, run, []upload.Upload{upload.Upload{LocalPath: args[0], Bucket: args[1]}}, *opts.Log)
	}

	return cmd
}
