package subcommands

import (
	dashboard "lunchpail.io/pkg/dashboard/terminal"

	"github.com/spf13/cobra"
)

func NewDashboardCmd() *cobra.Command {
	var dashboardCmd = &cobra.Command{
		Use:   "dashboard",
		Short: "Present a dashboard of activity",
		Long:  "Present a dashboard of activity",
		RunE: func(cmd *cobra.Command, args []string) error {
			return dashboard.Run()
		},
	}
	return dashboardCmd
}

func init() {
	rootCmd.AddCommand(NewDashboardCmd())
}
