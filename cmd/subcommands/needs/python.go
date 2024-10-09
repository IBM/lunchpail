package needs

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/needs"
)

func Python() *cobra.Command {
	var requirementsPath string
	cmd := &cobra.Command{
		Use:   "python <version> [-r /path/to/requirements.txt]",
		Short: "Install python environment",
		Long:  "Install python environment",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	logOpts := options.AddLogOptions(cmd)
	cmd.Flags().StringVarP(&requirementsPath, "requirements", "r", requirementsPath, "Install from the given requirements file")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		version := "latest"
		if len(args) >= 1 {
			version = args[0]
		}

		return needs.InstallPython(context.Background(), version, requirementsPath, needs.Options{LogOptions: *logOpts})
	}

	return cmd
}
