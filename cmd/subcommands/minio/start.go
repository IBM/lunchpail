package minio

import (
	"fmt"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/runtime/minio"
)

func NewStartCmd() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "start",
		Short: "Start a minio server",
		Long:  "Start a minio server",
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if compilation.IsCompiled() {
			// TODO: pull out command line and other
			// embeddings from this compiled executable
			return fmt.Errorf("TODO")
		}

		return minio.Start()
	}

	return cmd
}
