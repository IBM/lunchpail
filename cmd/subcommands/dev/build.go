package dev

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/lunchpail/images"
	"lunchpail.io/pkg/lunchpail/images/build"
)

func Build() *cobra.Command {
	var productionFlag bool
	var forceFlag bool

	var cmd = &cobra.Command{
		Use:   "build",
		Short: "Build the base images",
		Long:  "Build the base images",
	}
	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return images.Build(build.BuildOptions{Production: productionFlag, Verbose: logOpts.Verbose, Force: forceFlag})
	}

	cmd.Flags().BoolVarP(&productionFlag, "production", "p", productionFlag, "Build production images")
	cmd.Flags().BoolVarP(&forceFlag, "force", "f", forceFlag, "Delete and rebuild images")

	return cmd
}
