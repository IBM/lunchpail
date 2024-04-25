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
	var verboseFlag bool
	var queueFlag string
	var needsCsiH3Flag bool = false
	var needsCsiS3Flag bool = false
	var needsCsiNfsFlag bool = false
	var hasGpuSupportFlag bool = false
	var dockerHostFlag string = ""
	var forceFlag bool

	var cmd = &cobra.Command{
		Use:   "shrinkwrap path-or-git",
		Short: "Shrinkwrap a given application",
		Long:  "Shrinkwrap a given application",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			overrideValues, err := cmd.Flags().GetStringSlice("set")
			if err != nil {
				return err
			}

			return shrinkwrap.App(args[0], outputDirFlag, shrinkwrap.AppOptions{namespaceFlag, appNameFlag, clusterIsOpenShiftFlag, workdirViaMountFlag, imagePullSecretFlag, branchFlag, overrideValues, verboseFlag, queueFlag, needsCsiH3Flag, needsCsiS3Flag, needsCsiNfsFlag, hasGpuSupportFlag, dockerHostFlag, forceFlag})
		},
	}

	cmd.Flags().SortFlags = false

	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", "", "Output directory")
	if err := cmd.MarkFlagRequired("output-directory"); err != nil {
		log.Fatalf("Required option -o/--output-directory <outputDirectoryPath>")
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&imagePullSecretFlag, "image-pull-secret", "s", imagePullSecretFlag, "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	cmd.Flags().StringVarP(&queueFlag, "queue", "", queueFlag, "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&needsCsiS3Flag, "s3-mounts", "", needsCsiS3Flag, "Enable mounting S3 as a filesystem")
	cmd.Flags().BoolVarP(&clusterIsOpenShiftFlag, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&hasGpuSupportFlag, "gpu", "", false, "Include Nvidia GPU support")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")
	cmd.Flags().BoolVarP(&forceFlag, "force", "f", false, "[Danger  ] Force overwrite existing output directory")

	cmd.Flags().StringSliceVarP(&overrideValuesFlag, "set", "", overrideValuesFlag, "[Advanced] override specific template values")
	cmd.Flags().StringVarP(&appNameFlag, "app-name", "a", "", "[Advanced] Override default/inferred application name")
	cmd.Flags().BoolVarP(&workdirViaMountFlag, "workdir-via-mount", "w", workdirViaMountFlag, "[Advanced] Mount working directory in filesystem")
	cmd.Flags().StringVarP(&dockerHostFlag, "docker-host", "d", dockerHostFlag, "[Advanced] Hostname/IP address of docker host")

	return cmd
}
