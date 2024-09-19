//go:build full || deploy || manage || observe

package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be/target"
	"lunchpail.io/pkg/compilation"
)

func AddTargetOptions(cmd *cobra.Command) *compilation.TargetOptions {
	return AddTargetOptionsTo(cmd, &compilation.Options{})
}

func AddTargetOptionsTo(cmd *cobra.Command, opts *compilation.Options) *compilation.TargetOptions {
	if opts.Target == nil {
		opts.Target = &compilation.TargetOptions{}
	}
	if compilation.IsCompiled() && opts.Target.Namespace == "" {
		opts.Target.Namespace = compilation.Name()
	}
	if opts.Target.Platform == "" {
		opts.Target.Platform = target.Kubernetes
	}

	cmd.Flags().VarP(&opts.Target.Platform, "target", "t", "Deployment target [local, kubernetes, ibmcloud, skypilot]")
	cmd.Flags().StringVarP(&opts.Target.Namespace, "namespace", "n", opts.Target.Namespace, "Kubernetes namespace to deploy to")

	return opts.Target
}
