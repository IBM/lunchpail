//go:build full || build

package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/build"
)

func AddBuildOptions(cmd *cobra.Command) (*build.Options, error) {
	options, err := RestoreBuildOptions()
	if err != nil {
		return nil, err
	}

	cmd.Flags().StringVarP(&options.ImagePullSecret, "image-pull-secret", "s", options.ImagePullSecret, "Of the form <user>:<token>@ghcr.io")
	cmd.Flags().StringVar(&options.Queue, "queue", options.Queue, "Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)")
	cmd.Flags().BoolVar(&options.HasGpuSupport, "gpu", options.HasGpuSupport, "Run with GPUs (if supported by the application)")

	cmd.Flags().StringSliceVar(&[]string{}, "set", []string{}, "[Advanced] override specific template values")
	cmd.Flags().StringSliceVar(&[]string{}, "set-file", []string{}, "[Advanced] override specific template values with content from a file")

	cmd.Flags().StringVarP(&options.ApiKey, "api-key", "a", options.ApiKey, "IBM Cloud api key")
	cmd.Flags().StringVar(&options.ResourceGroupID, "resource-group-id", options.ResourceGroupID, "Identifier of a Cloud resource group to contain the instance(s)")
	//Todo: allow selecting existing ssh key?
	cmd.Flags().StringVar(&options.SSHKeyType, "ssh-key-type", options.SSHKeyType, "SSH key type [rsa, ed25519]")
	cmd.Flags().StringVar(&options.PublicSSHKey, "public-ssh-key", options.PublicSSHKey, "An existing or new SSH public key to identify user on the instance")
	cmd.Flags().StringVar(&options.Zone, "zone", options.Zone, "A location to host the instance")
	cmd.Flags().StringVar(&options.Profile, "profile", options.Profile, "An instance profile type to choose size and capability of the instance")
	//TODO: make public image as default
	cmd.Flags().StringVar(&options.ImageID, "image-id", options.ImageID, "Identifier of a catalog or custom image to be used for instance creation")
	cmd.Flags().BoolVarP(&options.CreateNamespace, "create-namespace", "N", options.CreateNamespace, "Create a new namespace, if needed")

	AddTargetOptionsTo(cmd, &options)
	AddLogOptionsTo(cmd, &options)
	return &options, nil
}
