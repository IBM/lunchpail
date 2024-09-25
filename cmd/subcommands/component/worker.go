package component

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/component/worker"
)

func Worker() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "worker",
		Short: "Commands that act as an application worker",
		Long:  "Commands that act as an application worker",
	}

	cmd.AddCommand(worker.Run())
	cmd.AddCommand(worker.PreStop())

	return cmd
}
