package images

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/images"
	"lunchpail.io/pkg/images/build"
)

func NewBuildCmd() *cobra.Command {
	var productionFlag bool = false

	var cmd = &cobra.Command{
		Use:   "build",
		Short: "Build the base images",
		Long:  "Build the base images",
		RunE: func(cmd *cobra.Command, args []string) error {
			return images.Build(build.BuildOptions{productionFlag})
		},
	}

	cmd.Flags().BoolVarP(&productionFlag, "production", "p", productionFlag, "Build production images")

	return cmd
}
