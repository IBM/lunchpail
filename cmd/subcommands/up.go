package subcommands

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/fe/linker"

	"github.com/spf13/cobra"
)

func addAssemblyOptions(cmd *cobra.Command) *assembly.Options {
	var options assembly.Options

	cmd.Flags().StringVarP(&options.Namespace, "namespace", "n", "", "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&options.ImagePullSecret, "image-pull-secret", "s", "", "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&options.Queue, "queue", "", "", "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&options.ClusterIsOpenShift, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&options.HasGpuSupport, "gpu", "", false, "Run with GPUs (if supported by the application)")

	cmd.Flags().StringSliceVarP(&options.OverrideValues, "set", "", []string{}, "[Advanced] override specific template values")
	cmd.Flags().StringVarP(&options.DockerHost, "docker-host", "d", "", "[Advanced] Hostname/IP address of docker host")

	return &options
}

func newUpCmd() *cobra.Command {
	var verboseFlag bool
	var dryrunFlag bool
	var watchFlag bool
	var createNamespace bool

	var cmd = &cobra.Command{
		Use:   "up",
		Short: "Deploy the application",
		Long:  "Deploy the application",
	}

	cmd.Flags().SortFlags = false
	appOpts := addAssemblyOptions(cmd)
	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "After deployment, watch for status updates")
	cmd.Flags().BoolVarP(&createNamespace, "create-namespace", "N", false, "Create a new Kubernetes namespace")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}

		assemblyOptions := assembly.Options{Namespace: appOpts.Namespace, ClusterIsOpenShift: appOpts.ClusterIsOpenShift, ImagePullSecret: appOpts.ImagePullSecret, OverrideValues: overrideValues, Queue: appOpts.Queue, HasGpuSupport: appOpts.HasGpuSupport, DockerHost: appOpts.DockerHost}
		configureOptions := linker.ConfigureOptions{AssemblyOptions: assemblyOptions, CreateNamespace: createNamespace, Verbose: verboseFlag}

		return boot.Up(boot.UpOptions{ConfigureOptions: configureOptions, DryRun: dryrunFlag, Watch: watchFlag})
	}

	return cmd
}

func init() {
	if assembly.IsAssembled() {
		rootCmd.AddCommand(newUpCmd())
	}
}
