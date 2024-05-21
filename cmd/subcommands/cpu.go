package subcommands

import (
	"lunchpail.io/pkg/observe/cpu"

	"github.com/spf13/cobra"
)

func Newcmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool
	var intervalSecondsFlag int

	var cmd = &cobra.Command{
		Use:   "cpu",
		Short: "Displays CPU utilization",
		Long:  "Displays CPU utilization",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return cpu.UI(maybeRun, cpu.CpuOptions{namespaceFlag, verboseFlag, intervalSecondsFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().IntVarP(&intervalSecondsFlag, "interval", "i", 2, "Sampling interval")

	return cmd
}

func init() {
	rootCmd.AddCommand(Newcmd())
}
