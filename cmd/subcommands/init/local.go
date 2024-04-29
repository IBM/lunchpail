package init

import (
	"github.com/spf13/cobra"
	initialize "lunchpail.io/pkg/init"
)

func NewInitLocalCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "local",
		Short: "Initialize a local control plane",
		Long:  "Initialize a local control plane",
		RunE: func(cmd *cobra.Command, args []string) error {
			return initialize.Local()
		},
	}

	return cmd
}
