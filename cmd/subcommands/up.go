package subcommands

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/boot"
	"lunchpail.io/pkg/fe/linker"
	initialize "lunchpail.io/pkg/lunchpail/init"
	"lunchpail.io/pkg/util"

	"github.com/spf13/cobra"
)

func addAssemblyOptions(cmd *cobra.Command) *assembly.Options {
	var options assembly.Options

	cmd.Flags().StringVarP(&options.Namespace, "namespace", "n", "", "Kubernetes namespace to deploy to")
	cmd.Flags().StringSliceVarP(&options.RepoSecrets, "repo-secret", "r", []string{}, "Of the form <user>:<pat>@<githubUrl> e.g. me:3333@https://github.com")
	cmd.Flags().StringVarP(&options.ImagePullSecret, "image-pull-secret", "s", "", "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVarP(&options.Queue, "queue", "", "", "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVarP(&options.ClusterIsOpenShift, "openshift", "t", false, "Include support for OpenShift")
	cmd.Flags().BoolVarP(&options.HasGpuSupport, "gpu", "", false, "Run with GPUs (if supported by the application)")

	cmd.Flags().StringSliceVarP(&options.OverrideValues, "set", "", []string{}, "[Advanced] override specific template values")
	cmd.Flags().StringVarP(&options.DockerHost, "docker-host", "d", "", "[Advanced] Hostname/IP address of docker host")

	cmd.Flags().StringVarP(&options.ApiKey, "api-key", "a", "", "IBM Cloud api key")
	cmd.Flags().StringVarP(&options.TargetPlatform, "target-platform", "p", be.Kubernetes, "Backend platform for deploying lunchpail [Kubernetes, IBMCloud, Skypilot]")
	cmd.Flags().StringVarP(&options.ResourceGroupID, "resource-group-id", "", "", "Identifier of a Cloud resource group to contain the instance(s)")
	cmd.Flags().StringVarP(&options.SSHKeyType, "ssh-key-type", "", "rsa", "SSH key type [rsa, ed25519]")
	cmd.Flags().StringVarP(&options.PublicSSHKey, "public-ssh-key", "", "", "An existing or new SSH public key to identify user on the instance")
	cmd.Flags().StringVarP(&options.Zone, "zone", "", "", "A location to host the instance")
	cmd.Flags().StringVarP(&options.Profile, "profile", "", "bx2-8x32", "An instance profile type to choose size and capability of the instance")
	cmd.Flags().StringVarP(&options.ImageID, "image-id", "", "", "Identifier of a catalog or custom image to be used for instance creation")
	return &options
}

func newUpCmd() *cobra.Command {
	var verboseFlag bool
	var dryrunFlag bool
	watchFlag := false
	var createCluster bool
	var createNamespace bool

	var cmd = &cobra.Command{
		Use:   "up",
		Short: "Deploy the application",
		Long:  "Deploy the application",
	}

	if util.StdoutIsTty() {
		// default to watch if we are connected to a TTY
		watchFlag = true
	}

	cmd.Flags().SortFlags = false
	appOpts := addAssemblyOptions(cmd)
	cmd.Flags().BoolVarP(&dryrunFlag, "dry-run", "", false, "Emit application yaml to stdout")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", false, "Verbose output")
	cmd.Flags().BoolVarP(&watchFlag, "watch", "w", watchFlag, "After deployment, watch for status updates")
	cmd.Flags().BoolVarP(&createCluster, "create-cluster", "I", false, "Create a new (local) Kubernetes cluster, if needed")
	cmd.Flags().BoolVarP(&createNamespace, "create-namespace", "N", false, "Create a new Kubernetes namespace, if needed")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		if appOpts.TargetPlatform == be.Kubernetes && createCluster {
			if err := initialize.Local(initialize.InitLocalOptions{BuildImages: false, Verbose: verboseFlag}); err != nil {
				return err
			}

			// if we were asked to create a cluster, then certainly we will want to create a namespace
			createNamespace = true
		}

		overrideValues, err := cmd.Flags().GetStringSlice("set")
		if err != nil {
			return err
		}

		repoSecrets, err := cmd.Flags().GetStringSlice("repo-secret")
		if err != nil {
			return err
		}

		assemblyOptions := assembly.Options{Namespace: appOpts.Namespace, ClusterIsOpenShift: appOpts.ClusterIsOpenShift, RepoSecrets: repoSecrets,
			ImagePullSecret: appOpts.ImagePullSecret, OverrideValues: overrideValues, Queue: appOpts.Queue,
			HasGpuSupport: appOpts.HasGpuSupport, DockerHost: appOpts.DockerHost,
			ApiKey: appOpts.ApiKey, TargetPlatform: appOpts.TargetPlatform, ResourceGroupID: appOpts.ResourceGroupID, SSHKeyType: appOpts.SSHKeyType, PublicSSHKey: appOpts.PublicSSHKey,
			Zone: appOpts.Zone, Profile: appOpts.Profile, ImageID: appOpts.ImageID}
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
