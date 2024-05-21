package subcommands

import (
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap"

	"github.com/spf13/cobra"
)

func addAppOptions(cmd *cobra.Command) *lunchpail.AppOptions {
	var appOptions lunchpail.AppOptions

	cmd.Flags().StringVarP(&appOptions.Namespace, "namespace", "n", "", "Kubernetes namespace to deploy to")
	cmd.Flags().StringVarP(&appOptions.ImagePullSecret, "image-pull-secret", "s", "", "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&appOptions.Queue, "queue", "", "", "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&appOptions.ClusterIsOpenShift, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&appOptions.HasGpuSupport, "gpu", "", false, "Include Nvidia GPU support")

	cmd.Flags().StringSliceVarP(&appOptions.OverrideValues, "set", "", []string{}, "[Advanced] override specific template values")
	cmd.Flags().StringVarP(&appOptions.DockerHost, "docker-host", "d", "", "[Advanced] Hostname/IP address of docker host")

	return &appOptions
}

func newUpCmd() *cobra.Command {
	var verboseFlag bool
	var dryrunFlag bool
	var watchFlag bool

	var cmd = &cobra.Command{
		Use:   "up",
		Short: "Deploy the application",
		Long:  "Deploy the application",
	}

	cmd.Flags().SortFlags = false
	appOpts := addAppOptions(cmd)
	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", false, "After deployment, watch for status updates")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}

		return shrinkwrap.Up(shrinkwrap.UpOptions{shrinkwrap.AppOptions{appOpts.Namespace, appOpts.ClusterIsOpenShift, appOpts.ImagePullSecret, overrideValues, verboseFlag, appOpts.Queue, appOpts.HasGpuSupport, appOpts.DockerHost, dryrunFlag}, watchFlag})
	}

	return cmd
}

func init() {
	if lunchpail.IsAssembled() {
		rootCmd.AddCommand(newUpCmd())
	}
}
