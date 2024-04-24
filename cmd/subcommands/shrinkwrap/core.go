package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
	"log"
)

func NewCoreCmd() *cobra.Command {
	var namespaceFlag string = "jaas-system"
	var imagePullSecretFlag string
	var clusterIsOpenShiftFlag bool = false
	var needsCsiH3Flag bool = false
	var needsCsiS3Flag bool = false
	var needsCsiNfsFlag bool = false
	var hasGpuSupportFlag bool = false
	var outputFlag string
	var dockerHostFlag string = ""
	var overrideValuesFlag []string = []string{}
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "core [flags] sourcePath",
		Short: "Shrinkwrap the core",
		Long:  "Shrinkwrap the core",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			overrideValues, err := cmd.Flags().GetStringSlice("set")
			if err != nil {
				return err
			}

			return shrinkwrap.Core(outputFlag, shrinkwrap.CoreOptions{namespaceFlag, clusterIsOpenShiftFlag, needsCsiH3Flag, needsCsiS3Flag, needsCsiNfsFlag, hasGpuSupportFlag, dockerHostFlag, overrideValues, imagePullSecretFlag, verboseFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&imagePullSecretFlag, "image-pull-secret", "s", imagePullSecretFlag, "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().BoolVarP(&clusterIsOpenShiftFlag, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&hasGpuSupportFlag, "gpu", "", false, "Include Nvidia GPU support")
	cmd.Flags().BoolVarP(&needsCsiS3Flag, "s3-mounts", "", needsCsiS3Flag, "Enable mounting S3 as a filesystem")
	cmd.Flags().StringVarP(&dockerHostFlag, "docker-host", "d", dockerHostFlag, "Hostname/IP address of docker host")
	cmd.Flags().StringSliceVarP(&overrideValuesFlag, "set", "", overrideValuesFlag, "Advanced usage: override specific template values")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Include verbose output")

	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Output file path, using - for stdout")
	if err := cmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputFilePath>")
	}

	return cmd
}
