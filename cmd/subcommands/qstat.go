package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/qstat"
)

func newQstatCommand() *cobra.Command {
	var namespaceFlag string
	var tailFlag int64
	var followFlag bool
	var verboseFlag bool
	var quietFlag bool

	var cmd = &cobra.Command{
		Use:   "qstat",
		Short: "Stream queue statistics to console",
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Track updates (rather than printing once)")
	cmd.Flags().Int64VarP(&tailFlag, "tail", "T", -1, "Number of lines to tail")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&quietFlag, "quiet", "q", false, "Silence extraneous output")
	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		backend, err := be.New(tgtOpts.TargetPlatform, assembly.Options{}) // TODO assembly.Options
		if err != nil {
			return err
		}

		return qstat.UI(maybeRun, backend, qstat.Options{Namespace: namespaceFlag, Follow: followFlag, Tail: tailFlag, Verbose: verboseFlag, Quiet: quietFlag})
	}

	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newQstatCommand())
	}
}
