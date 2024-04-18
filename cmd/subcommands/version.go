package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "version",
	Long:  "version",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Printf("%s\n", lunchpail.Version())
		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
