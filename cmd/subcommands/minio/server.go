package minio

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/runtime/minio"
)

func Server() *cobra.Command {
	return &cobra.Command{
		Use:   "server",
		Short: "Run as the minio component",
		Long:  "Run as the minio component",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return minio.Server()
		},
	}
}
