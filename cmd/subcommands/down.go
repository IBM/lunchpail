package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/boot"
)

func newDownCmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool
	var deleteNamespaceFlag bool
	var deleteAllRunsFlag bool

	var cmd = &cobra.Command{
		Use:   "down [run1] [run2] ...",
		Short: "Undeploy the application",
		Long:  "Undeploy the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			return boot.DownList(args, boot.DownOptions{Namespace: namespaceFlag, Verbose: verboseFlag, DeleteNamespace: deleteNamespaceFlag, DeleteAll: deleteAllRunsFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Vebose output")
	cmd.Flags().BoolVarP(&deleteNamespaceFlag, "delete-namespace", "N", false, "Also delete namespace (only for empty namespaces)")
	cmd.Flags().BoolVarP(&deleteAllRunsFlag, "all", "A", false, "Delete all runs in the given namespace")

	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newDownCmd())
	}
}
