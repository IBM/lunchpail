package build

func BuildController(cli ContainerCli, opts BuildOptions) error {
	dir := "controller"
	name := "run"
	suffix := "-controller"
	if !opts.Max {
		suffix = suffix + "-lite"
	}

	dockerfile := "Dockerfile"
	if !opts.Max {
		dockerfile = "Dockerfile.lite"
	}

	return buildAndPushImage(dir, name, suffix, dockerfile, cli, opts)
}
