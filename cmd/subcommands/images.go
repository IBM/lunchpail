//go:build full || build || manage

package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/cmd/subcommands/images"
	"lunchpail.io/pkg/build"
)

func newImagesCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "images",
		Short: "Manage base images",
		Long:  "Manage base images",
	}
}

func init() {
	if !build.IsBuilt() {
		imagesCmd := newImagesCommand()
		rootCmd.AddCommand(imagesCmd)
		imagesCmd.AddCommand(images.NewBuildCmd())
	}
}
