package images

import (
	"context"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail/images/build"
)

func Build(opts build.BuildOptions) error {
	cli, err := build.WhichContainerCli()
	if err != nil {
		return err
	}

	errs, _ := errgroup.WithContext(context.Background())

	errs.Go(func() error {
		return build.BuildComponents(cli, opts)
	})

	errs.Go(func() error {
		return build.BuildController(cli, opts)
	})

	return errs.Wait()
}
