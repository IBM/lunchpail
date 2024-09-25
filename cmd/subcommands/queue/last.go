//go:build full || observe

package queue

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/qstat"
)

func Last() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "last",
		Short: "Stream queue statistics to console",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
	}

	opts, err := options.RestoreCompilationOptions()
	if err != nil {
		panic(err)
	}

	options.AddTargetOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		marker := args[0]
		extra := ""
		if len(args) > 1 {
			extra = args[1]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		val, err := qstat.Qlast(ctx, marker, extra, backend, qstat.QlastOptions{})
		if err != nil {
			return err
		}

		fmt.Println(val)
		return nil
	}

	return cmd
}
