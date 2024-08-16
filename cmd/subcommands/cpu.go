//go:build full || observe

package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/cpu"
)

func Newcmd() *cobra.Command {
	var namespaceFlag string
	var verboseFlag bool
	var intervalSecondsFlag int

	var cmd = &cobra.Command{
		Use:   "cpu",
		Short: "Displays CPU utilization",
		Long:  "Displays CPU utilization",
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().IntVarP(&intervalSecondsFlag, "interval", "i", 2, "Sampling interval")
	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		backend, err := be.New(tgtOpts.TargetPlatform, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		return cpu.UI(maybeRun, backend, cpu.CpuOptions{Namespace: namespaceFlag, Verbose: verboseFlag, IntervalSeconds: intervalSecondsFlag})
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(Newcmd())
}
