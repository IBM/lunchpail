package subcommands

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
)

type TargetOptions = be.TargetOptions

func addTargetOptions(cmd *cobra.Command) TargetOptions {
	options := TargetOptions{TargetPlatform: be.Kubernetes}

	if compilation.IsCompiled() {
		// by default, we use Namespace == app name
		options.Namespace = compilation.Name()
	}

	cmd.Flags().VarP(&options.TargetPlatform, "target", "t", "Deployment target [kubernetes, ibmcloud, skypilot]")
	cmd.Flags().StringVarP(&options.Namespace, "namespace", "n", options.Namespace, "Kubernetes namespace to deploy to")

	return options
}
