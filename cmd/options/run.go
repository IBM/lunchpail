package options

import "github.com/spf13/cobra"

type RunOptions struct {
	Run string
}

func AddRunOptions(cmd *cobra.Command) *RunOptions {
	options := RunOptions{}
	cmd.Flags().StringVarP(&options.Run, "run", "r", "", "Inspect the given run, defaulting to using the singleton run")
	return &options
}
