package images

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/images"
	"lunchpail.io/pkg/images/build"
)

func NewBuildCmd() *cobra.Command {
	var maxFlag bool = false
	var productionFlag bool = false

	var cmd = &cobra.Command{
		Use:   "build",
		Short: "Build the base images",
		Long:  "Build the base images",
		RunE: func(cmd *cobra.Command, args []string) error {
			return images.Build(build.BuildOptions{maxFlag, productionFlag})
		},
	}

	cmd.Flags().BoolVarP(&maxFlag, "max", "m", maxFlag, "Build controller to support Ray, Torch, etc.")
	cmd.Flags().BoolVarP(&productionFlag, "production", "p", productionFlag, "Build production images")

	return cmd
}
