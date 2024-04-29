package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
)

// RootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use: "lunchpail",
}

func Execute() {
	if lunchpail.IsAssembled() {
		rootCmd.Use = lunchpail.AssembledAppName()
	}

	rootCmd.Execute()
}

func init() {
	// rootCmd.SilenceUsage = true
}
