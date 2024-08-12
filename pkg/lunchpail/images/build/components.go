package build

func BuildComponents(cli ContainerCli, opts BuildOptions) error {
	if opts.Force && !opts.Production {
		// HACK ALERT. Podman is stupid. It sometimes gets
		// stuck on images with the wrong arch. This can
		// happen if you have just built cross-platform
		// manifests, and now want to build a single-platform
		// image.
		rm("docker.io/library/alpine:3", Image, cli, opts.Verbose)
	}

	return buildAndPushImage(".", "lunchpail", "Dockerfile", cli, opts)
}
