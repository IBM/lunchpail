package minio

import (
	"context"

	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/minio"
)

func Server() *cobra.Command {
	var port int

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Run as the minio component",
		Long:  "Run as the minio component",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return minio.Server(context.Background(), port)
		},
	}

	cmd.Flags().IntVarP(&port, "port", "p", 9000, "Port to use for the Minio api endpoint")

	return cmd
}
