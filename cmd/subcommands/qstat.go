package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap/qstat"
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
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}
			return qstat.UI(maybeRun, qstat.Options{namespaceFlag, followFlag, tailFlag, verboseFlag, quietFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Track updates (rather than printing once)")
	cmd.Flags().Int64VarP(&tailFlag, "tail", "t", -1, "Number of lines to tail")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&quietFlag, "quiet", "q", false, "Silence extraneous output")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newQstatCommand())
	}
}
