package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/cmd/subcommands/images"
	"lunchpail.io/pkg/assembly"
)

func newImagesCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "images",
		Short: "Manage base images",
		Long:  "Manage base images",
	}
}

func init() {
	if !assembly.IsAssembled() {
		imagesCmd := newImagesCommand()
		rootCmd.AddCommand(imagesCmd)
		imagesCmd.AddCommand(images.NewBuildCmd())
	}
}
