package subcommands

import (
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
	"log"
)

func addAppOptions(cmd *cobra.Command) *lunchpail.AppOptions {
	var appOptions lunchpail.AppOptions

	cmd.Flags().StringVarP(&appOptions.Namespace, "namespace", "n", "", "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&appOptions.ImagePullSecret, "image-pull-secret", "s", "", "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&appOptions.Queue, "queue", "", "", "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&appOptions.ClusterIsOpenShift, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&appOptions.HasGpuSupport, "gpu", "", false, "Include Nvidia GPU support")

	cmd.Flags().StringSliceVarP(&appOptions.OverrideValues, "set", "", []string{}, "[Advanced] override specific template values")
	cmd.Flags().BoolVarP(&appOptions.WorkdirViaMount, "workdir-via-mount", "w", false, "[Advanced] Mount working directory in filesystem")
	cmd.Flags().StringVarP(&appOptions.DockerHost, "docker-host", "d", "", "[Advanced] Hostname/IP address of docker host")

	return &appOptions
}

func newShrinkwrapCmd() *cobra.Command {
	var outputDirFlag string
	var verboseFlag bool
	var needsCsiH3Flag bool = false
	var needsCsiS3Flag bool = false
	var needsCsiNfsFlag bool = false
	var forceFlag bool

	var cmd = &cobra.Command{
		Use:   "shrinkwrap",
		Short: "Shrinkwrap a given application",
		Long:  "Shrinkwrap a given application",
	}

	cmd.Flags().SortFlags = false

	cmd.Flags().StringVarP(&outputDirFlag, "output-directory", "o", "", "Output directory")
	if err := cmd.MarkFlagRequired("output-directory"); err != nil {
		log.Fatalf("Required option -o/--output-directory <outputDirectoryPath>")
	}

	appOpts := addAppOptions(cmd)
	cmd.Flags().BoolVarP(&needsCsiS3Flag, "s3-mounts", "", needsCsiS3Flag, "Enable mounting S3 as a filesystem")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")
	cmd.Flags().BoolVarP(&forceFlag, "force", "f", false, "[Danger  ] Force overwrite existing output directory")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}

		return shrinkwrap.App(outputDirFlag, shrinkwrap.AppOptions{appOpts.Namespace, appOpts.ClusterIsOpenShift, appOpts.WorkdirViaMount, appOpts.ImagePullSecret, overrideValues, verboseFlag, appOpts.Queue, needsCsiH3Flag, needsCsiS3Flag, needsCsiNfsFlag, appOpts.HasGpuSupport, appOpts.DockerHost, forceFlag})
	}

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newShrinkwrapCmd())
	}
}
