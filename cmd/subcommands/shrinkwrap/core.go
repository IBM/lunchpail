package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
	"log"
)

func NewCoreCmd() *cobra.Command {
	var namespaceFlag string = "jaas-system"
	var maxFlag bool = false
	var clusterIsOpenShiftFlag bool = false
	var needsCsiH3Flag bool = false
	var needsCsiS3Flag bool = false
	var needsCsiNfsFlag bool = false
	var hasGpuSupportFlag bool = false
	var outputFlag string
	var dockerHostFlag string = ""
	var overrideValuesFlag []string = []string{}

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

			return shrinkwrap.Core(outputFlag, shrinkwrap.CoreOptions{namespaceFlag, maxFlag, clusterIsOpenShiftFlag, needsCsiH3Flag, needsCsiS3Flag, needsCsiNfsFlag, hasGpuSupportFlag, dockerHostFlag, overrideValues})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	cmd.Flags().BoolVarP(&maxFlag, "max", "m", false, "Include Ray, Torch, etc. support")
	cmd.Flags().BoolVarP(&clusterIsOpenShiftFlag, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&hasGpuSupportFlag, "gpu", "", false, "Include Nvidia GPU support")
	cmd.Flags().BoolVarP(&needsCsiS3Flag, "s3-mounts", "", needsCsiS3Flag, "Enable mounting S3 as a filesystem (included with --max)")
	cmd.Flags().StringVarP(&dockerHostFlag, "docker-host", "d", dockerHostFlag, "Hostname/IP address of docker host")
	cmd.Flags().StringSliceVarP(&overrideValuesFlag, "set", "", overrideValuesFlag, "Advanced usage: override specific template values")

	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Output file path, using - for stdout")
	if err := cmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputFilePath>")
	}

	return cmd
}
