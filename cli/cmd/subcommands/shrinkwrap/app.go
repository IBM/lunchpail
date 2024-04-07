package shrinkwrap

import (
	"github.com/spf13/cobra"
)

var AppCmd = &cobra.Command{
	Use:   "app",
	Short: "Shrinkwrap a given application",
	Long:  "Shrinkwrap a given application",
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

func init() {
}
