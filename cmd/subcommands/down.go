package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
)

func newDownCmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool
	var deleteNamespaceFlag bool
	var deleteAllRunsFlag bool
	var apiKey string
	var deleteCloudResourcesFlag bool

	var cmd = &cobra.Command{
		Use:   "down [run1] [run2] ...",
		Short: "Undeploy the application",
		Long:  "Undeploy the application",
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&deleteNamespaceFlag, "delete-namespace", "N", false, "Also delete namespace (only for empty namespaces)")
	cmd.Flags().BoolVarP(&deleteAllRunsFlag, "all", "A", false, "Delete all runs in the given namespace")
	cmd.Flags().StringVarP(&apiKey, "api-key", "a", "", "IBM Cloud api key")
	cmd.Flags().BoolVarP(&deleteCloudResourcesFlag, "delete-cloud-resources", "D", false, "Delete all associated cloud resources and the virtual instance. If not enabled, the instance will only be stopped")

	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		backend, err := be.New(tgtOpts.TargetPlatform, assembly.Options{}) // TODO assembly.Options
		if err != nil {
			return err
		}

		return boot.DownList(args, backend, boot.DownOptions{
			Namespace: namespaceFlag, Verbose: verboseFlag, DeleteNamespace: deleteNamespaceFlag,
			DeleteAll: deleteAllRunsFlag,
			ApiKey:    apiKey, DeleteCloudResources: deleteCloudResourcesFlag})
	}

	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newDownCmd())
	}
}
