//go:build full || deploy || manage || observe

package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/be/target"
	"lunchpail.io/pkg/build"
)

func AddTargetOptions(cmd *cobra.Command) *build.TargetOptions {
	return AddTargetOptionsTo(cmd, &build.Options{})
}

func AddTargetOptionsTo(cmd *cobra.Command, opts *build.Options) *build.TargetOptions {
	if opts.Target == nil {
		opts.Target = &build.TargetOptions{}
	}
	if build.IsBuilt() && opts.Target.Namespace == "" {
		opts.Target.Namespace = build.Name()
	}
	if opts.Target.Platform == "" {
		opts.Target.Platform = target.Kubernetes
	}

	cmd.Flags().VarP(&opts.Target.Platform, "target", "t", "Deployment target [local, kubernetes, ibmcloud, skypilot]")
	cmd.Flags().StringVarP(&opts.Target.Namespace, "namespace", "n", opts.Target.Namespace, "Kubernetes namespace to deploy to")

	return opts.Target
}
