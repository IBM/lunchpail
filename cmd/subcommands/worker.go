package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/worker"
)

func newWorkerCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "worker",
		Short: "Commands that act as an application worker",
		Long:  "Commands that act as an application worker",
	}
}

func init() {
	workerCmd := newWorkerCmd()
	rootCmd.AddCommand(workerCmd)
	workerCmd.AddCommand(worker.NewRunCmd())
	workerCmd.AddCommand(worker.NewPreStopCmd())
}
