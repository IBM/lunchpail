package build

import (
	"context"
	"io/ioutil"
	"path/filepath"

	"golang.org/x/sync/errgroup"
)

func BuildComponents(cli ContainerCli, opts BuildOptions) error {
	base := "images/components"

	files, err := ioutil.ReadDir(base)
	if err != nil {
		return err
	}

	errs, _ := errgroup.WithContext(context.Background())

	for _, f := range files {
		if !f.IsDir() {
			continue
		}

		components, err := ioutil.ReadDir(filepath.Join(base, f.Name()))
		if err != nil {
			return err
		}

		for _, c := range components {
			if !c.IsDir() {
				continue
			}

			errs.Go(func() error {
				return buildAndPushImage(filepath.Join(base, f.Name(), c.Name()), c.Name(), "-component", "Dockerfile", cli, opts)
			})
		}
	}

	return errs.Wait()
}