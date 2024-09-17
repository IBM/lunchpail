package init

import (
	"context"

	"github.com/spf13/cobra"

	initialize "lunchpail.io/pkg/lunchpail/init"
)

func NewInitLocalCmd() *cobra.Command {
	var buildFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "local",
		Short: "Initialize a local control plane",
		Long:  "Initialize a local control plane",
		RunE: func(cmd *cobra.Command, args []string) error {
			return initialize.Local(context.Background(), initialize.InitLocalOptions{BuildImages: buildFlag, Verbose: verboseFlag})
		},
	}

	cmd.Flags().BoolVarP(&buildFlag, "build-images", "b", false, "Also build Lunchpail support images")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	return cmd
}
