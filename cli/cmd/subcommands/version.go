package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "version",
	Long:  "version",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Printf("%s\n", "v0.0.1")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
