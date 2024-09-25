package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/lunchpail"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "version",
	Long:  "version",
	RunE: func(cmd *cobra.Command, args []string) error {
		if build.IsBuilt() && build.AppVersion() != "" {
			fmt.Printf("Application Version: %s\n", build.AppVersion())
		}

		fmt.Printf("  Lunchpail Version: %s\n", lunchpail.Version())

		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
