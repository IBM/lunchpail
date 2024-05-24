package images

import (
	"lunchpail.io/pkg/lunchpail/images/build"
)

func Build(opts build.BuildOptions) error {
	cli, err := build.WhichContainerCli()
	if err != nil {
		return err
	}

	return build.BuildComponents(cli, opts)
}
