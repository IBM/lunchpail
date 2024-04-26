package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/demo"
)

func newDemoCmd() *cobra.Command {
	var outputDirFlag string
	var namespaceFlag string
	var branchFlag string
	var verboseFlag bool
	var forceFlag bool
	var imagePullSecretFlag string
	var nFlag int = 10

	var cmd = &cobra.Command{
		Use:   "demo",
		Short: "Shrinkwrap a demo application",
		Long:  "Shrinkwrap a demo application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return demo.Shrinkwrap(demo.Options{nFlag, namespaceFlag, outputDirFlag, branchFlag, imagePullSecretFlag, verboseFlag, forceFlag})
		},
	}

	cmd.Flags().IntVarP(&nFlag, "num-tasks", "N", nFlag, "Number of tasks to perform")
	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", outputDirFlag, "Output directory")
	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&imagePullSecretFlag, "image-pull-secret", "s", imagePullSecretFlag, "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")
	cmd.Flags().BoolVarP(&forceFlag, "force", "f", false, "[Danger] Force overwrite existing output directory")

	return cmd
}

func init() {
	rootCmd.AddCommand(newDemoCmd())
}
