//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/queue"
	"lunchpail.io/pkg/compilation"
)

func init() {
	cmd := &cobra.Command{
		Use:   "queue",
		Short: "Commands related to the queue",
	}
	rootCmd.AddCommand(cmd)

	if compilation.IsCompiled() {
		cmd.AddCommand(queue.Cat())
		cmd.AddCommand(queue.Last())
		cmd.AddCommand(queue.Ls())
		cmd.AddCommand(queue.Stat())
		cmd.AddCommand(queue.Upload())
	}

	// Currently components rely on these operations, and in
	// Kubernetes, we currently use the "uncompiled" raw
	// `lunchpail` executable for these operations:
	cmd.AddCommand(queue.Add())
	cmd.AddCommand(queue.Done())
	cmd.AddCommand(queue.Download())
}
