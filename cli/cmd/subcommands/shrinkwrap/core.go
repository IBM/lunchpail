package shrinkwrap

import (
	"github.com/spf13/cobra"
)

var CoreCmd = &cobra.Command{
	Use:   "core",
	Short: "Shrinkwrap the core",
	Long:  "Shrinkwrap the core",
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

func init() {
}
