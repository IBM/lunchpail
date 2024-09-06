//go:build full || observe

package run

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/compilation"
)

func Instances() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "instances",
		Short: "Report the number of instances of a given component",
	}

	tgtOpts := options.AddTargetOptions(cmd)
	component := options.AddComponentOption(cmd)
	cmd.MarkFlagRequired("component")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		backend, err := be.New(*tgtOpts, compilation.Options{}) // TODO compilation.Options
		if err != nil {
			return err
		}

		runname := ""
		if len(args) > 0 {
			runname = args[0]
		} else if r, err := util.Singleton(backend); err != nil {
			return err
		} else {
			runname = r.Name
		}

		count, err := backend.InstanceCount(*component, runname)
		if err != nil {
			return err
		}
		fmt.Printf("%d\n", count)

		return nil
	}

	return cmd
}
