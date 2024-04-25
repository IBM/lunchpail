package subcommands

import (
	"log"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/demo"
)

func newDemoCmd() *cobra.Command {
	var outputDirFlag string
	var namespaceFlag string
	var branchFlag string
	var verboseFlag bool
	var forceFlag bool

	var cmd = &cobra.Command{
		Use:   "demo",
		Short: "Shrinkwrap a demo application",
		Long:  "Shrinkwrap a demo application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return demo.Shrinkwrap(demo.Options{namespaceFlag, outputDirFlag, branchFlag, verboseFlag, forceFlag})
		},
	}

	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", "", "Output directory")
	if err := cmd.MarkFlagRequired("output-directory"); err != nil {
		log.Fatalf("Required option -o/--output-directory <outputDirectoryPath>")
	}

	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")
	cmd.Flags().BoolVarP(&forceFlag, "force", "f", false, "[Danger] Force overwrite existing output directory")

	return cmd
}

func init() {
	rootCmd.AddCommand(newDemoCmd())
}
