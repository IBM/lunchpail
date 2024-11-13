package component

import (
	"context"

	"github.com/spf13/cobra"
	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/runtime"
)

type RunLocallyOptions struct {
	Component string
	LLIR      string
	build.LogOptions
}

func AddRunLocallyOptions(cmd *cobra.Command) *RunLocallyOptions {
	options := RunLocallyOptions{}
	cmd.Flags().StringVarP(&options.Component, "component", "", "", "")
	cmd.Flags().StringVar(&options.LLIR, "llir", "", "")
	cmd.MarkFlagRequired("component")
	cmd.MarkFlagRequired("llir")
	return &options
}

func RunLocally() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "run-locally",
		Short: "Commands for running a component locally",
		Long:  "Commands for running a component locally",
	}

	runOpts := AddRunLocallyOptions(cmd)
	options.AddLogOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return runtime.RunLocally(context.Background(), runOpts.Component, runOpts.LLIR, runOpts.LogOptions)
	}

	return cmd
}
