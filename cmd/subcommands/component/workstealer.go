package component

import (
	"context"
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/workstealer"
)

func WorkStealer() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "workstealer",
		Short: "Run a work stealer",
		Long:  "Run a work stealer",
		Args:  cobra.MatchAll(cobra.OnlyValidArgs),
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return workstealer.Run(context.Background())
	}

	return cmd
}
