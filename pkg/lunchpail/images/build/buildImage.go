package build

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/lunchpail"
)

type ImageOrManifest string

const (
	Image    ImageOrManifest = "image"
	Manifest                 = "manifest"
)

func exists(image string, kind ImageOrManifest, cli ContainerCli, verbose bool) (bool, error) {
	cmd := exec.Command(string(cli), string(kind), "exists", image)
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return false, err
	}
	if err := cmd.Wait(); err != nil {
		// image/manifest does not exist
		return false, nil
	}

	return true, nil
}

func rm(image string, kind ImageOrManifest, cli ContainerCli, verbose bool) error {
	cmd := exec.Command(string(cli), string(kind), "rm", image)
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		// failure to remove image/manifest
		return err
	}

	return nil
}

func createManifest(image string, cli ContainerCli, verbose bool) error {
	cmd := exec.Command(string(cli), "manifest", "create", image)
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		// failure to create manifest
		return err
	}

	return nil
}

func imageName(name string) string {
	return filepath.Join(lunchpail.ImageRegistry, lunchpail.ImageRepo, name+":"+lunchpail.Version())
}

func buildIt(dir, name, dockerfile string, kind ImageOrManifest, cli ContainerCli, verbose bool) (string, error) {
	image := imageName(name)

	var cmd *exec.Cmd
	if kind == "manifest" {
		cmd = exec.Command(
			string(cli),
			"build",
			"--platform=linux/arm64/v8,linux/amd64",
			"--manifest", image,
			"-f", dockerfile,
			".",
		)
	} else {
		// clean out prior "final" and "temp" layers before building a new one
		if err := clean(cli, "final"); err != nil {
			return "", err
		}
		if err := clean(cli, "temp"); err != nil {
			return "", err
		}

		cmd = exec.Command(
			string(cli),
			"build",
			"-t", image,

			"-f", dockerfile,
			".",
		)
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Building %s %s in %s %v\n", string(kind), name, dir, cmd)
	} else {
		fmt.Fprintf(os.Stderr, "Building %s\n", name)
	}

	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return "", err
	}
	if err := cmd.Wait(); err != nil {
		// failure to build image/manifest
		return "", err
	}

	return image, nil

	// TODO --build-arg registry=$IMAGE_REGISTRY --build-arg repo=$IMAGE_REPO --build-arg version=$VERSION \
}

func clean(cli ContainerCli, label string) error {
	cmd := exec.Command(
		string(cli),
		"image",
		"prune",
		"--force",
		"--filter",
		"label=lunchpail="+label,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func buildProd(dir, name, dockerfile string, cli ContainerCli, verbose bool, force bool) (string, error) {
	image := imageName(name)

	imageExists, ierr := exists(image, "image", cli, verbose)
	if ierr != nil {
		return "", ierr
	}

	manifestExists, merr := exists(image, "manifest", cli, verbose)
	if merr != nil {
		return "", merr
	}

	if force || (imageExists && !manifestExists) {
		// we have a previously built image that is not a manifest
		fmt.Fprintf(os.Stderr, "Clearing out prior non-manifest image %s\n", image)
		if err := rm(image, "image", cli, verbose); err != nil {
			return "", err
		}
	}

	if !manifestExists {
		if err := createManifest(image, cli, verbose); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, dockerfile, "manifest", cli, verbose)
}

func buildDev(dir, name, dockerfile string, cli ContainerCli, verbose bool) (string, error) {
	image := imageName(name)

	if manifestExists, err := exists(image, "manifest", cli, verbose); err != nil {
		return "", err
	} else if manifestExists {
		// we have a previously built manifest that is not an image
		fmt.Fprintf(os.Stderr, "Removing prior manifest from prod builds %s\n", image)
		if err := rm(image, "manifest", cli, verbose); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, dockerfile, "image", cli, verbose)
}

func buildImage(dir, name, dockerfile string, cli ContainerCli, opts BuildOptions) (string, error) {
	if opts.Production {
		return buildProd(dir, name, dockerfile, cli, opts.Verbose, opts.Force)
	} else {
		return buildDev(dir, name, dockerfile, cli, opts.Verbose)
	}
}

func buildAndPushImage(dir, name, dockerfile string, cli ContainerCli, opts BuildOptions) error {
	image, err := buildImage(dir, name, dockerfile, cli, opts)
	if err != nil {
		return err
	}

	return pushImage(image, cli, opts)
}
