package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe"
)

func newLogsCommand() *cobra.Command {
	var namespaceFlag string
	var componentsFlag []string
	var followFlag bool
	var verboseFlag bool

	var cmd = &cobra.Command{
		Use:   "logs",
		Short: "Print or stream logs from the application",
		Long:  "Print or stream logs from the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			maybeRun := ""
			if len(args) > 0 {
				maybeRun = args[0]
			}

			components, err := cmd.Flags().GetStringSlice("component")
			if err != nil {
				return err
			}

			comps := []lunchpail.Component{}
			for _, component := range components {
				if component == "workers" {
					comps = append(comps, lunchpail.WorkersComponent)
				} else if component == "dispatcher" {
					comps = append(comps, lunchpail.DispatcherComponent)
				} else if component == "workstealer" {
					comps = append(comps, lunchpail.WorkStealerComponent)
				} else if component == "lunchpail" {
					comps = append(comps, lunchpail.RuntimeComponent)
				} else {
					return fmt.Errorf("Unsupported component %s", component)
				}
			}

			return shrinkwrap.Logs(maybeRun, shrinkwrap.LogsOptions{namespaceFlag, followFlag, verboseFlag, comps})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().StringSliceVarP(&componentsFlag, "component", "c", []string{"workers"}, "Components to track (workers|dispatcher|workstealer)")
	cmd.Flags().BoolVarP(&followFlag, "follow", "f", false, "Stream the logs")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newLogsCommand())
	}
}
