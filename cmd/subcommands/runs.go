//go:build full || observe

package subcommands

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/compilation"
)

func newRunsCommand() *cobra.Command {
	var name bool
	var latest bool

	var cmd = &cobra.Command{
		Use:   "runs",
		Short: "List recent runs",
	}
	cmd.Flags().BoolVarP(&name, "name", "N", false, "Show only the run name")
	cmd.Flags().BoolVarP(&latest, "latest", "l", false, "Show only the most recent run")
	tgtOpts := addTargetOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		backend, err := be.New(*tgtOpts, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		runs, err := backend.ListRuns()
		if err != nil {
			return err
		}

		return ui(runs, name, latest)
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newRunsCommand())
	}
}

// TODO move to a pkg/observe/runs/ui?
func ui(runs []runs.Run, name, latest bool) error {
	if len(runs) == 0 {
		return nil
	}

	if latest {
		runs = runs[:1]
	}

	maxlen := 0
	if !name {
		for _, run := range runs {
			l := len(run.Name)
			if l > maxlen {
				maxlen = l
			}
		}
	}
	for _, run := range runs {
		if name {
			fmt.Println(run.Name)
		} else {
			fmt.Printf("%*s %s\n", maxlen, run.Name, run.CreationTimestamp)
		}
	}

	return nil
}
