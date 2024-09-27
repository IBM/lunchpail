package options

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/build"
)

func AddLogOptions(cmd *cobra.Command) *build.LogOptions {
	return AddLogOptionsTo(cmd, &build.Options{})
}

func AddLogOptionsTo(cmd *cobra.Command, opts *build.Options) *build.LogOptions {
	if opts.Log == nil {
		opts.Log = &build.LogOptions{}
	}

	cmd.Flags().BoolVarP(&opts.Log.Debug, "debug", "g", opts.Log.Debug, "Debug output")
	cmd.Flags().BoolVarP(&opts.Log.Verbose, "verbose", "v", opts.Log.Verbose, "Verbose output")
	return opts.Log
}
