package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/observe/qstat"
)

func newQlastCommand() *cobra.Command {
	var namespaceFlag string

	var cmd = &cobra.Command{
		Use:   "qlast",
		Short: "Stream queue statistics to console",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			marker := args[0]
			extra := ""
			if len(args) > 1 {
				extra = args[1]
			}
			val, err := qstat.Qlast(marker, extra, qstat.QlastOptions{Namespace: namespaceFlag})
			if err != nil {
				return err
			}

			fmt.Println(val)
			return nil
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")

	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newQlastCommand())
	}
}
