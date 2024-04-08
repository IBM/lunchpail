package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
	"log"
)

func NewAppCmd() *cobra.Command {
	var outputDirFlag string

	var cmd = &cobra.Command{
		Use:   "app",
		Short: "Shrinkwrap a given application",
		Long:  "Shrinkwrap a given application",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return shrinkwrap.App(args[0], outputDirFlag, shrinkwrap.AppOptions{})
		},
	}

	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", "", "Output directory")
	if err := cmd.MarkFlagRequired("output-directory"); err != nil {
		log.Fatalf("Required option -o/--output-directory <outputDirectoryPath>")
	}

	return cmd
}
