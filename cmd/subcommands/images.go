package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/cmd/subcommands/images"
)

func init() {
	var imagesCmd = &cobra.Command{
		Use:   "images",
		Short: "Manage base images",
		Long:  "Manage base images",
	}

	rootCmd.AddCommand(imagesCmd)
	imagesCmd.AddCommand(images.NewBuildCmd())
}
