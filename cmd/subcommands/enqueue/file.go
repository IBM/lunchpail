package enqueue

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/queue"
)

func NewEnqueueFileCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "file <file>",
		Short: "Enqueue a single file as a work task",
		Long:  "Enqueue a single file as a work task",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	}

	var wait bool
	var verbose bool
	cmd.Flags().BoolVarP(&wait, "wait", "w", false, "Wait for the task to be completed")
	cmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "Verbose output")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return queue.EnqueueFile(args[0], queue.EnqueueFileOptions{Wait: wait, Verbose: verbose})
	}

	return cmd
}
