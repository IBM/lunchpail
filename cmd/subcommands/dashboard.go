package subcommands

import (
	"lunchpail.io/pkg/dashboard"

	"github.com/spf13/cobra"
)

var dashboardCmd = &cobra.Command{
	Use:   "dashboard",
	Short: "Present a dashboard of activity",
	Long:  "Present a dashboard of activity",
	RunE: func (cmd *cobra.Command, args []string) error {
		return dashboard.Run()
	},
}

func init() {
	rootCmd.AddCommand(dashboardCmd)
}
