package subcommands

import (
	"lunchpail.io/pkg/cpu"

	"github.com/spf13/cobra"
)

func Newcmd() *cobra.Command {
	var namespaceFlag string
	var watchFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "cpu",
		Short: "Displays CPU utilization",
		Long:  "Displays CPU utilization",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return cpu.UI(maybeRun, cpu.CpuOptions{Namespace: namespaceFlag, Watch: watchFlag, Verbose: verboseFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "Watches for changes in list of runs")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")

	return cmd
}

func init() {
	rootCmd.AddCommand(Newcmd())
}
