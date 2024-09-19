//go:build full || deploy

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/compilation"
)

func newDownCmd() *cobra.Command {
	var deleteNamespaceFlag bool
	var deleteAllRunsFlag bool
	var apiKey string
	var deleteCloudResourcesFlag bool

	var cmd = &cobra.Command{
		Use:   "down [run1] [run2] ...",
		Short: "Undeploy the application",
		Long:  "Undeploy the application",
	}

	cmd.Flags().BoolVarP(&deleteNamespaceFlag, "delete-namespace", "N", false, "Also delete namespace (only for empty namespaces)")
	cmd.Flags().BoolVarP(&deleteAllRunsFlag, "all", "A", false, "Delete all runs in the given namespace")
	cmd.Flags().StringVarP(&apiKey, "api-key", "a", "", "IBM Cloud api key")
	cmd.Flags().BoolVarP(&deleteCloudResourcesFlag, "delete-cloud-resources", "D", false, "Delete all associated cloud resources and the virtual instance. If not enabled, the instance will only be stopped")

	opts, err := options.RestoreCompilationOptions()
	if err != nil {
		return nil
	}

	options.AddTargetOptionsTo(cmd, &opts)
	options.AddLogOptionsTo(cmd, &opts)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.New(ctx, opts)
		if err != nil {
			return err
		}

		return boot.DownList(ctx, args, backend, boot.DownOptions{
			Namespace: opts.Target.Namespace, Verbose: opts.Log.Verbose, DeleteNamespace: deleteNamespaceFlag,
			DeleteAll: deleteAllRunsFlag,
			ApiKey:    apiKey, DeleteCloudResources: deleteCloudResourcesFlag})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newDownCmd())
	}
}
