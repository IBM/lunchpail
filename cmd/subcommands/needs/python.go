package needs

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/needs"
)

func Python() *cobra.Command {
	var requirements string
	cmd := &cobra.Command{
		Use:   "python <version> [-r base64EncodedRequirements]",
		Short: "Install python environment",
		Long:  "Install python environment",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	logOpts := options.AddLogOptions(cmd)
	cmd.Flags().StringVarP(&requirements, "requirements", "r", requirements, "Install the given requirements")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		version := "latest"
		if len(args) >= 1 {
			version = args[0]
		}

		out, err := needs.InstallPython(context.Background(), version, requirements, needs.Options{LogOptions: *logOpts})
		if err != nil {
			return err
		}

		fmt.Println(out)
		return nil
	}

	return cmd
}
