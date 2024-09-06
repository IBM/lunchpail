//go:build full || deploy || manage || observe

package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
)

func AddTargetOptions(cmd *cobra.Command) *be.TargetOptions {
	options := be.TargetOptions{TargetPlatform: be.Kubernetes}

	if compilation.IsCompiled() {
		// by default, we use Namespace == app name
		options.Namespace = compilation.Name()
	}

	cmd.Flags().VarP(&options.TargetPlatform, "target", "t", "Deployment target [local, kubernetes, ibmcloud, skypilot]")
	cmd.Flags().StringVarP(&options.Namespace, "namespace", "n", options.Namespace, "Kubernetes namespace to deploy to")

	return &options
}
