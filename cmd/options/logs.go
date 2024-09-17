package options

import (
	"github.com/spf13/cobra"
	"lunchpail.io/pkg/compilation"
)

func AddLogOptions(cmd *cobra.Command) *compilation.LogOptions {
	return addLogOptionsTo(cmd, &compilation.Options{})
}

func addLogOptionsTo(cmd *cobra.Command, opts *compilation.Options) *compilation.LogOptions {
	if opts.Log == nil {
		opts.Log = &compilation.LogOptions{}
	}

	cmd.Flags().BoolVarP(&opts.Log.Debug, "debug", "d", opts.Log.Debug, "Debug output")
	cmd.Flags().BoolVarP(&opts.Log.Verbose, "verbose", "v", opts.Log.Verbose, "Verbose output")
	return opts.Log
}
