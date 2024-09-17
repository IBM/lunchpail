package enqueue

import (
	"context"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/queue"
)

func NewEnqueueFileCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "file <file>",
		Short: "Enqueue a single file as a work task",
		Long:  "Enqueue a single file as a work task",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	}

	var opts queue.EnqueueFileOptions
	var ignoreWorkerErrors bool
	cmd.Flags().BoolVarP(&opts.Wait, "wait", "w", false, "Wait for the task to be completed, and exit with the exit code of that task")
	cmd.Flags().BoolVar(&ignoreWorkerErrors, "ignore-worker-errors", false, "When --wait, ignore any errors from the workers processing the tasks")

	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if !opts.Wait && ignoreWorkerErrors {
			return fmt.Errorf("Invalid combination of options, not --wait and --ignore-worker-errors")
		}

		opts.Verbose = logOpts.Verbose
		opts.Debug = logOpts.Debug
		exitcode, err := queue.EnqueueFile(context.Background(), args[0], opts)

		switch {
		case err != nil:
			return err
		case exitcode != 0 && !ignoreWorkerErrors:
			os.Exit(exitcode)
		}

		return nil
	}

	return cmd
}
