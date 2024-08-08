package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/observe/qstat"
)

func newQlastCommand() *cobra.Command {
	var namespaceFlag string

	var cmd = &cobra.Command{
		Use:   "qlast",
		Short: "Stream queue statistics to console",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		marker := args[0]
		extra := ""
		if len(args) > 1 {
			extra = args[1]
		}

		backend, err := be.New(tgtOpts.TargetPlatform, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		val, err := qstat.Qlast(marker, extra, backend, qstat.QlastOptions{Namespace: namespaceFlag})
		if err != nil {
			return err
		}

		fmt.Println(val)
		return nil
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newQlastCommand())
	}
}
