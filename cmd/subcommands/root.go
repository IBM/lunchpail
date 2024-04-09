package subcommands

import (
	"github.com/spf13/cobra"
)

// RootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "lunchpail",
	Short: "lunchpail",
	Long:  "lunchpail",
}

func Execute() {
	rootCmd.Execute()
}

func init() {
	rootCmd.SilenceUsage = true
}
