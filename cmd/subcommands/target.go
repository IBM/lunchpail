package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be/platform"
)

type TargetOptions struct {
	TargetPlatform platform.Platform
}

func addTargetOptions(cmd *cobra.Command) *TargetOptions {
	var options TargetOptions
	options.TargetPlatform = platform.Kubernetes
	cmd.Flags().VarP(&options.TargetPlatform, "target", "t", "Deployment target [kubernetes, ibmcloud, skypilot]")
	return &options
}
