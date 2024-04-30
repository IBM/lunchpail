package images

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/images"
	"lunchpail.io/pkg/images/build"
)

func NewBuildCmd() *cobra.Command {
	var productionFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "build",
		Short: "Build the base images",
		Long:  "Build the base images",
		RunE: func(cmd *cobra.Command, args []string) error {
			return images.Build(build.BuildOptions{productionFlag, verboseFlag})
		},
	}

	cmd.Flags().BoolVarP(&productionFlag, "production", "p", productionFlag, "Build production images")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")

	return cmd
}
