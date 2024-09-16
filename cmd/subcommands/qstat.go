//go:build full || observe

package subcommands

import (
	"context"
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/qstat"
)

func newQstatCommand() *cobra.Command {
	var tailFlag int64
	var followFlag bool
	var verboseFlag bool
	var quietFlag bool

	var cmd = &cobra.Command{
		Use:   "qstat",
		Short: "Stream queue statistics to console",
	}

	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Track updates (rather than printing once)")
	cmd.Flags().Int64VarP(&tailFlag, "tail", "T", -1, "Number of lines to tail")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&quietFlag, "quiet", "q", false, "Silence extraneous output")
	tgtOpts := options.AddTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		backend, err := be.New(compilation.Options{Target: tgtOpts})
		if err != nil {
			return err
		}

		return qstat.UI(context.Background(), maybeRun, backend, qstat.Options{Follow: followFlag, Tail: tailFlag, Verbose: verboseFlag, Quiet: quietFlag})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQstatCommand())
	}
}
