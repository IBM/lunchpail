//go:build full || observe

package subcommands

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	comp "lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe"
)

func newLogsCommand() *cobra.Command {
	var componentsFlag []string
	var followFlag bool
	var tailFlag int

	var cmd = &cobra.Command{
		Use:   "logs",
		Short: "Print or stream logs from the application",
		Long:  "Print or stream logs from the application",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	cmd.Flags().StringSliceVarP(&componentsFlag, "component", "c", []string{"workers"}, "Components to track (workers|dispatcher|workstealer)")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Stream the logs")
	cmd.Flags().IntVarP(&tailFlag, "tail", "T", -1, "Lines of recent log file to display, with -1 showing all available log data")
	runOpts := options.AddRunOptions(cmd)
	tgtOpts := options.AddTargetOptions(cmd)
	logOpts := options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		backend, err := be.New(ctx, compilation.Options{Target: tgtOpts})
		if err != nil {
			return err
		}

		components, err := cmd.Flags().GetStringSlice("component")
		if err != nil {
			return err
		}

		comps := []comp.Component{}
		for _, component := range components {
			if component == "workers" {
				comps = append(comps, comp.WorkersComponent)
			} else if component == "dispatcher" {
				comps = append(comps, comp.DispatcherComponent)
			} else if component == "workstealer" {
				comps = append(comps, comp.WorkStealerComponent)
			} else {
				return fmt.Errorf("Unsupported component %s", component)
			}
		}

		return observe.Logs(ctx, runOpts.Run, backend, observe.LogsOptions{Follow: followFlag, Tail: tailFlag, Verbose: logOpts.Verbose, Components: comps})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newLogsCommand())
	}
}
