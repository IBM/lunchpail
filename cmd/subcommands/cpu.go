//go:build full || observe

package subcommands

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/cpu"
)

func Newcmd() *cobra.Command {
	var intervalSecondsFlag int

	var cmd = &cobra.Command{
		Use:   "cpu",
		Short: "Displays CPU utilization",
		Long:  "Displays CPU utilization",
	}

	cmd.Flags().IntVarP(&intervalSecondsFlag, "interval", "i", 2, "Sampling interval")
	tgtOpts := options.AddTargetOptions(cmd)
	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		ctx := context.Background()
		backend, err := be.New(ctx, compilation.Options{Target: tgtOpts, Log: logOpts})
		if err != nil {
			return err
		}

		return cpu.UI(ctx, maybeRun, backend, cpu.CpuOptions{Namespace: tgtOpts.Namespace, Verbose: logOpts.Verbose, IntervalSeconds: intervalSecondsFlag})
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(Newcmd())
}
