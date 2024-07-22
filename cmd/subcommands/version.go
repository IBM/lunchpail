package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/lunchpail"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "version",
	Long:  "version",
	RunE: func(cmd *cobra.Command, args []string) error {
		version := lunchpail.Version()
		if assembly.IsAssembled() {
			version = assembly.AppVersion()
		}

		fmt.Printf("%s\n", version)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
