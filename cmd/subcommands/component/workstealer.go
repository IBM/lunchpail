package component

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/component/workstealer"
)

func WorkStealer() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "workstealer",
		Short: "Commands for running work stealer components",
		Long:  "Commands for running work stealer components",
	}

	cmd.AddCommand(workstealer.Run())

	return cmd
}
