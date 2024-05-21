package build

func BuildController(cli ContainerCli, opts BuildOptions) error {
	dir := "controller"
	name := "run"
	suffix := "-controller-lite"
	dockerfile := "Dockerfile"

	return buildAndPushImage(dir, name, suffix, dockerfile, cli, opts)
}
