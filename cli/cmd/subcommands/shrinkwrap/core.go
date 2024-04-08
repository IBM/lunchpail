package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"log"
	"github.com/spf13/cobra"
)

var namespaceFlag string = "jaas-system"
var maxFlag bool = false
var clusterIsOpenShiftFlag bool = false
var needsCsiH3Flag bool = false
var needsCsiS3Flag bool = false
var needsCsiNfsFlag bool = false
var hasGpuSupportFlag bool = false
var outputFlag string

var CoreCmd = &cobra.Command{
	Use: "core [flags] sourcePath",
	Short: "Shrinkwrap the core",
	Long:  "Shrinkwrap the core",
	Args: cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	RunE: func(cmd *cobra.Command, args []string) error {
		shrinkwrap.Core(args[0], outputFlag, shrinkwrap.CoreOptions{namespaceFlag, maxFlag, clusterIsOpenShiftFlag, needsCsiH3Flag, needsCsiS3Flag, needsCsiNfsFlag, hasGpuSupportFlag })
		return nil
	},
}

func init() {
	CoreCmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", namespaceFlag, "Kubernetes namespace to deploy to")
	CoreCmd.Flags().BoolVarP(&maxFlag, "max", "m", false, "Include Ray, Torch, etc. support")
	CoreCmd.Flags().BoolVarP(&clusterIsOpenShiftFlag, "openshift", "t", false, "Include support for OpenShift")
	CoreCmd.Flags().BoolVarP(&hasGpuSupportFlag, "gpu", "", false, "Include Nvidia GPU support")

	CoreCmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Output file path, using - for stdout")
	if err := CoreCmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputFilePath>")
	}
}
