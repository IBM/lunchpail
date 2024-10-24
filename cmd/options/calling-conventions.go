package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/build"
)

func AddCallingConventionOptions(cmd *cobra.Command) *build.Options {
	opts := &build.Options{}
	AddCallingConventionOptionsTo(cmd, opts)
	cmd.MarkFlagRequired("calling-convention")
	return opts
}

func AddCallingConventionOptionsTo(cmd *cobra.Command, options *build.Options) {
	cmd.Flags().VarP(&options.CallingConvention, "calling-convention", "C", "Task input and output calling convention [files, stdio]")
}
