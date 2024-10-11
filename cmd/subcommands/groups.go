package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/build"
)

var runGroup = &cobra.Group{ID: "Run", Title: "Run Commands"}
var dataGroup = &cobra.Group{ID: "Data", Title: "Data Commands"}
var internalGroup = &cobra.Group{ID: "Internal", Title: "Advanced/Internal Commands"}
var applicationGroup = &cobra.Group{ID: "Application", Title: "Application Commands"}

func initGroups(rootCmd *cobra.Command) {
	rootCmd.AddGroup(applicationGroup)
	rootCmd.AddGroup(dataGroup)
	if build.IsBuilt() {
		rootCmd.AddGroup(runGroup)
	}
	rootCmd.AddGroup(internalGroup)
}
