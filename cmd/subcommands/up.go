//go:build full || deploy

package subcommands

import (
	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker"
	initialize "lunchpail.io/pkg/lunchpail/init"
	"lunchpail.io/pkg/util"

	"github.com/spf13/cobra"
)

func addCompilationOptions(cmd *cobra.Command, skipNamespaceFlag bool) *compilation.Options {
	var options compilation.Options

	if !skipNamespaceFlag {
		cmd.Flags().StringVarP(&options.Namespace, "namespace", "n", "", "Kubernetes namespace to deploy to")
	}

	cmd.Flags().StringVarP(&options.ImagePullSecret, "image-pull-secret", "s", "", "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&options.Queue, "queue", "", "", "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&options.HasGpuSupport, "gpu", "", false, "Run with GPUs (if supported by the application)")

	cmd.Flags().StringSliceVarP(&options.OverrideValues, "set", "", []string{}, "[Advanced] override specific template values")
	cmd.Flags().StringSliceVarP(&options.OverrideFileValues, "set-file", "", []string{}, "[Advanced] override specific template values with content from a file")

	cmd.Flags().StringVarP(&options.ApiKey, "api-key", "a", "", "IBM Cloud api key")
	cmd.Flags().StringVarP(&options.ResourceGroupID, "resource-group-id", "", "", "Identifier of a Cloud resource group to contain the instance(s)")
	//Todo: allow selecting existing ssh key?
	cmd.Flags().StringVarP(&options.SSHKeyType, "ssh-key-type", "", "rsa", "SSH key type [rsa, ed25519]")
	cmd.Flags().StringVarP(&options.PublicSSHKey, "public-ssh-key", "", "", "An existing or new SSH public key to identify user on the instance")
	cmd.Flags().StringVarP(&options.Zone, "zone", "", "", "A location to host the instance")
	cmd.Flags().StringVarP(&options.Profile, "profile", "", "bx2-8x32", "An instance profile type to choose size and capability of the instance")
	//TODO: make public image as default
	cmd.Flags().StringVarP(&options.ImageID, "image-id", "", "", "Identifier of a catalog or custom image to be used for instance creation")
	cmd.Flags().BoolVarP(&options.CreateNamespace, "create-namespace", "N", false, "Create a new namespace, if needed")
	return &options
}

func newUpCmd() *cobra.Command {
	var verboseFlag bool
	var dryrunFlag bool
	watchFlag := false
	var createCluster bool

	var cmd = &cobra.Command{
		Use:   "up",
		Short: "Deploy the application",
		Long:  "Deploy the application",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	if util.StdoutIsTty() {
		// default to watch if we are connected to a TTY
		watchFlag = true
	}

	cmd.Flags().SortFlags = false
	appOpts := addCompilationOptions(cmd, true)
	tgtOpts := options.AddTargetOptions(cmd)
	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", watchFlag, "After deployment, watch for status updates")
	cmd.Flags().BoolVarP(&createCluster, "create-cluster", "I", false, "Create a new (local) Kubernetes cluster, if needed")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if tgtOpts.TargetPlatform == be.Kubernetes && createCluster {
			if err := initialize.Local(initialize.InitLocalOptions{BuildImages: false, Verbose: verboseFlag}); err != nil {
				return err
			}

			// if we were asked to create a cluster, then certainly we will want to create a namespace
			appOpts.CreateNamespace = true
		}

		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}

		compilationOptions := compilation.Options{Namespace: appOpts.Namespace,
			ImagePullSecret: appOpts.ImagePullSecret, OverrideValues: overrideValues, Queue: appOpts.Queue,
			HasGpuSupport: appOpts.HasGpuSupport,
			ApiKey:        appOpts.ApiKey, ResourceGroupID: appOpts.ResourceGroupID, SSHKeyType: appOpts.SSHKeyType, PublicSSHKey: appOpts.PublicSSHKey,
			Zone: appOpts.Zone, Profile: appOpts.Profile, ImageID: appOpts.ImageID, CreateNamespace: appOpts.CreateNamespace}
		configureOptions := linker.ConfigureOptions{CompilationOptions: compilationOptions, Verbose: verboseFlag}

		backend, err := be.NewInitOk(true, *tgtOpts, compilationOptions)
		if err != nil {
			return err
		}

		return boot.Up(backend, boot.UpOptions{ConfigureOptions: configureOptions, DryRun: dryrunFlag, Watch: watchFlag})
	}

	return cmd
}

func init() {
	if compilation.IsCompiled() {
		rootCmd.AddCommand(newUpCmd())
	}
}
