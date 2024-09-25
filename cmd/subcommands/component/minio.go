package component

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/component/minio"
)

func Minio() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "minio",
		Short: "Commands for running minio components",
		Long:  "Commands for running minio components",
	}

	cmd.AddCommand(minio.Server())

	return cmd
}
