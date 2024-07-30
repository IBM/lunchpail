package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/boot"
)

func newDownCmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool
	var deleteNamespaceFlag bool
	var deleteAllRunsFlag bool
	var targetPlatform = platform.Kubernetes
	var apiKey string
	var deleteCloudResourcesFlag bool

	var cmd = &cobra.Command{
		Use:   "down [run1] [run2] ...",
		Short: "Undeploy the application",
		Long:  "Undeploy the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return boot.DownList(args, boot.DownOptions{
				Namespace: namespaceFlag, Verbose: verboseFlag, DeleteNamespace: deleteNamespaceFlag,
				DeleteAll: deleteAllRunsFlag, TargetPlatform: targetPlatform,
				ApiKey: apiKey, DeleteCloudResources: deleteCloudResourcesFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&deleteNamespaceFlag, "delete-namespace", "N", false, "Also delete namespace (only for empty namespaces)")
	cmd.Flags().BoolVarP(&deleteAllRunsFlag, "all", "A", false, "Delete all runs in the given namespace")
	cmd.Flags().VarP(&targetPlatform, "target", "t", "Deployment target [kubernetes, ibmcloud, skypilot]")
	cmd.Flags().StringVarP(&apiKey, "api-key", "a", "", "IBM Cloud api key")
	cmd.Flags().BoolVarP(&deleteCloudResourcesFlag, "delete-cloud-resources", "D", false, "Delete all associated cloud resources and the virtual instance. If not enabled, the instance will only be stopped")
	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newDownCmd())
	}
}
