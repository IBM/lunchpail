package init

import (
	"context"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/images"
	"lunchpail.io/pkg/images/build"
)

type InitLocalOptions struct {
	Verbose bool
}

func Local(opts InitLocalOptions) error {
	errs, _ := errgroup.WithContext(context.Background())

	if err := getContainerCli(); err != nil {
		return err
	}

	errs.Go(func() error {
		return getKubectl()
	})

	errs.Go(func() error {
		if err := getKind(); err != nil {
			return err
		}
		return createKindCluster()
	})

	errs.Go(func() error {
		return getNvidia()
	})

	if err := errs.Wait(); err != nil {
		return err
	}

	return images.Build(build.BuildOptions{false, opts.Verbose})
}
