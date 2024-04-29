package init

import (
	"context"
	"golang.org/x/sync/errgroup"
)

func Local() error {
	errs, _ := errgroup.WithContext(context.Background())

	errs.Go(func() error {
		return getKubectl()
	})

	errs.Go(func() error {
		return getContainerCli()
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

	return errs.Wait()
}
