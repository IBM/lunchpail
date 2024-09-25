package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/component"
)

func init() {
	cmd := &cobra.Command{
		Use:   "component",
		Short: "Commands related to specific components",
	}
	rootCmd.AddCommand(cmd)

	cmd.AddCommand(component.Minio())
	cmd.AddCommand(component.Worker())
	cmd.AddCommand(component.WorkStealer())
}
