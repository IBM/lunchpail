//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/queue"
	"lunchpail.io/pkg/build"
)

func init() {
	cmd := &cobra.Command{
		Use:     "queue",
		GroupID: internalGroup.ID,
		Short:   "Commands related to the queue",
	}
	rootCmd.AddCommand(cmd)

	if build.IsBuilt() {
		cmd.AddCommand(queue.Cat())
		cmd.AddCommand(queue.Last())
		cmd.AddCommand(queue.Ls())
		cmd.AddCommand(queue.Stat())
		cmd.AddCommand(queue.Upload())
	}

	// Currently components rely on these operations, and in
	// Kubernetes, we currently use the "unbuilt" raw
	// `lunchpail` executable for these operations:
	cmd.AddCommand(queue.Add())
	cmd.AddCommand(queue.Done())
	cmd.AddCommand(queue.Download())
}
