package dev

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	initialize "lunchpail.io/pkg/lunchpail/init"
)

func Init() *cobra.Command {
	var buildFlag bool

	var cmd = &cobra.Command{
		Use:   "init",
		Short: "Initialize a local control plane",
		Long:  "Initialize a local control plane",
	}

	cmd.Flags().BoolVarP(&buildFlag, "build-images", "b", false, "Also build Lunchpail support images")
	logOpts := options.AddLogOptions(cmd)

	cmd.RunE =
		func(cmd *cobra.Command, args []string) error {
			return initialize.Local(context.Background(), initialize.InitLocalOptions{BuildImages: buildFlag, Verbose: logOpts.Verbose})
		}

	return cmd
}
