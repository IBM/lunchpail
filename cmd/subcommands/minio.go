package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/minio"
)

func newMinioCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "minio",
		Short: "Command to start an internal minio s3",
		Long:  "Commands to start an internal minio s3",
	}
}

func init() {
	minioCmd := newMinioCmd()
	rootCmd.AddCommand(minioCmd)
	minioCmd.AddCommand(minio.NewStartCmd())
}
