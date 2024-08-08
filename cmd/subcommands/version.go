package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/lunchpail"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "version",
	Long:  "version",
	RunE: func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() && compilation.AppVersion() != "" {
			fmt.Printf("Application Version: %s\n", compilation.AppVersion())
		}

		fmt.Printf("  Lunchpail Version: %s\n", lunchpail.Version())

		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
