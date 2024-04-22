package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
	"log"
)

func NewAppCmd() *cobra.Command {
	var appNameFlag string
	var outputDirFlag string
	var namespaceFlag string
	var clusterIsOpenShiftFlag bool = false
	var imagePullSecretFlag string
	var branchFlag string
	var workdirViaMountFlag bool
	var overrideValuesFlag []string = []string{}
	var needsGangsFlag bool
	var verboseFlag bool
	var queueFlag string

	var cmd = &cobra.Command{
		Use:   "app",
		Short: "Shrinkwrap a given application",
		Long:  "Shrinkwrap a given application",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			overrideValues, err := cmd.Flags().GetStringSlice("set")
			if err != nil {
				return err
			}

			return shrinkwrap.App(args[0], outputDirFlag, shrinkwrap.AppOptions{namespaceFlag, appNameFlag, clusterIsOpenShiftFlag, workdirViaMountFlag, imagePullSecretFlag, branchFlag, overrideValues, needsGangsFlag, verboseFlag, queueFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&appNameFlag, "app-name", "a", "", "Override default/inferred application name")
	cmd.Flags().BoolVarP(&workdirViaMountFlag, "workdir-via-mount", "w", workdirViaMountFlag, "Mount working directory in filesystem")
	cmd.Flags().BoolVarP(&clusterIsOpenShiftFlag, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().StringVarP(&imagePullSecretFlag, "image-pull-secret", "s", imagePullSecretFlag, "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	cmd.Flags().StringSliceVarP(&overrideValuesFlag, "set", "", overrideValuesFlag, "Advanced usage: override specific template values")
	cmd.Flags().BoolVarP(&needsGangsFlag, "gang-scheduling", "", needsGangsFlag, "Include support for gang scheduling")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Include verbose output")
	cmd.Flags().StringVarP(&queueFlag, "queue", "", queueFlag, "Use the queue specified by this named Secret (with accessKeyID, secretAccessKey, and endpoint data)")

	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", "", "Output directory")
	if err := cmd.MarkFlagRequired("output-directory"); err != nil {
		log.Fatalf("Required option -o/--output-directory <outputDirectoryPath>")
	}

	return cmd
}
