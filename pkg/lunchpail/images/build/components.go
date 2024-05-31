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
	errs.SetLimit(2) // podman doesn't like lots of concurrent pushes

	if opts.Force && !opts.Production {
		// HACK ALERT. Podman is stupid. It sometimes gets
		// stuck on images with the wrong arch. This can
		// happen if you have just built cross-platform
		// manifests, and now want to build a single-platform
		// image.
		errs.Go(func() error { return rm("docker.io/library/alpine:3", Image, cli, opts.Verbose) })
	}

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
