package subcommands

import (
	"fmt"
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap"
)

func newLogsCommand() *cobra.Command {
	var namespaceFlag string
	var componentsFlag []string
	var verboseFlag bool
	
	var cmd = &cobra.Command{
		Use:   "logs",
		Short: "Print or stream logs from the application",
		Long:  "Print or stream logs from the application",
		RunE: func(cmd *cobra.Command, args []string) error {
			components, err := cmd.Flags().GetStringSlice("component")
			if err != nil {
				return err
			}

			comps := []shrinkwrap.Component{}
			for _, component := range components {
				if component == "workers" {
					comps = append(comps, shrinkwrap.WorkersComponent)
				} else if component == "dispatcher" {
					comps = append(comps, shrinkwrap.DispatcherComponent)
				} else if component == "workstealer" {
					comps = append(comps, shrinkwrap.WorkStealerComponent)
				} else if component == "lunchpail" {
					comps = append(comps, shrinkwrap.LunchpailComponent)
				} else {
					return fmt.Errorf("Unsupported component %s", component)
				}
			}

			return shrinkwrap.Logs(shrinkwrap.LogsOptions{namespaceFlag, verboseFlag, comps})
		},
	}

	cmd.Flags().StringVarP(&namespaceFlag, "namespace", "n", "", "Kubernetes namespace that houses your instance")
	cmd.Flags().StringSliceVarP(&componentsFlag, "component", "c", []string{"workers"}, "Components to track (workers|dispatcher|workstealer)")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newLogsCommand())
	}
}
