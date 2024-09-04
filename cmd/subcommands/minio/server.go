package minio

import (
	"os"
	"time"

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
			if err := minio.Server(); err != nil {
				return err
			}

			// Tests may want us to sleep a bit, so they
			// can capture data for validation checks.
			sleepyTimeStr := os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")
			if sleepyTimeStr != "" {
				sleepyTime, err := time.ParseDuration(sleepyTimeStr + "s")
				if err != nil {
					return err
				}
				time.Sleep(sleepyTime)
			}

			return nil
		},
	}
}
