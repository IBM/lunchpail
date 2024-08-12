package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/enqueue"
)

func newEnqueueCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "enqueue",
		Short: "Commands that help with enqueueing work tasks",
		Long:  "Commands that help with enqueueing work tasks",
	}
}

func init() {
	enqueueCmd := newEnqueueCmd()
	rootCmd.AddCommand(enqueueCmd)
	enqueueCmd.AddCommand(enqueue.NewEnqueueFileCmd())
	enqueueCmd.AddCommand(enqueue.NewEnqueueFromS3Cmd())
}
