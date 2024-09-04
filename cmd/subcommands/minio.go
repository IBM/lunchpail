package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/minio"
)

func newMinioCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "minio",
		Short: "Commands for running minio components",
		Long:  "Commands for running minio components",
	}
}

func init() {
	cmd := newMinioCmd()
	rootCmd.AddCommand(cmd)
	cmd.AddCommand(minio.Server())
}
