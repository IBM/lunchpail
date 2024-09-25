//go:build !(full || observe)

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/queue"
)

func init() {
	cmd := &cobra.Command{
		Use:   "queue",
		Short: "Commands related to the queue",
	}
	rootCmd.AddCommand(cmd)

	// Currently components rely on these operations, and in
	// Kubernetes, we currently use the "uncompiled" raw
	// `lunchpail` executable for these operations:
	cmd.AddCommand(queue.Add())
	cmd.AddCommand(queue.Done())
	cmd.AddCommand(queue.Download())
}
