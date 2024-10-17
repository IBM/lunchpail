//go:build full || observe

package queue

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/runtime/queue"
)

func Ls() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "ls [path]",
		Short: "List queue path",
		Long:  "List queue path",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	opts, err := options.RestoreBuildOptions()
	if err != nil {
		panic(err)
	}

	runOpts := options.AddRunOptions(cmd)
	options.AddTargetOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		path := ""
		if len(args) == 1 {
			path = args[0]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		run := runOpts.Run
		if run == "" {
			rrun, err := util.Singleton(ctx, backend)
			if err != nil {
				return err
			}
			run = rrun.Name
		}
		files, errors, err := queue.Ls(ctx, backend, run, path)
		if err != nil {
			return err
		}

		for {
			select {
			case err := <-errors:
				return err
			case file := <-files:
				fmt.Println(file)
			}
		}

		return nil
	}

	return cmd
}
