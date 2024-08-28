//go:build full || observe

package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	comp "lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe"
)

func newLogsCommand() *cobra.Command {
	var componentsFlag []string
	var followFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "logs",
		Short: "Print or stream logs from the application",
		Long:  "Print or stream logs from the application",
	}

	cmd.Flags().StringSliceVarP(&componentsFlag, "component", "c", []string{"workers"}, "Components to track (workers|dispatcher|workstealer)")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Stream the logs")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		maybeRun := ""
		if len(args) > 0 {
			maybeRun = args[0]
		}

		backend, err := be.New(tgtOpts, compilation.Options{}) // TODO compilation.Options
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

		return observe.Logs(maybeRun, backend, observe.LogsOptions{Follow: followFlag, Verbose: verboseFlag, Components: comps})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newLogsCommand())
	}
}
