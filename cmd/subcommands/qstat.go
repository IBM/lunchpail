package subcommands

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap"
)

func newQstatCommand() *cobra.Command {
	var namespaceFlag string
	var tailFlag int64
	var followFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "qstat",
		Short: "Stream queue statistics to console",
		RunE: func(cmd *cobra.Command, args []string) error {
			return shrinkwrap.Qstat(shrinkwrap.QstatOptions{namespaceFlag, followFlag, tailFlag, verboseFlag})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Track updates (rather than printing once)")
	cmd.Flags().Int64VarP(&tailFlag, "tail", "t", -1, "Number of lines to tail")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newQstatCommand())
	}
}
