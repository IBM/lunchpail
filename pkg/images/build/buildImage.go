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

func imageName(name, suffix string) string {
	imageRegistry := "ghcr.io" // TODO
	imageRepo := "lunchpail"   // TODO
	version := lunchpail.Version()
	provider := "jaas"

	return filepath.Join(imageRegistry, imageRepo, provider+"-"+name+suffix+":"+version)
}

func buildIt(dir, name, suffix, dockerfile string, kind ImageOrManifest, cli ContainerCli, verbose bool) (string, error) {
	image := imageName(name, suffix)

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
		cmd = exec.Command(
			string(cli),
			"build",
			"-t", image,
			"-f", dockerfile,
			".",
		)
	}

	if verbose {
		fmt.Printf("Building %s %s in %s %v\n", string(kind), name, dir, cmd)
	} else {
		fmt.Printf("Building %s\n", name)
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

func buildProd(dir, name, suffix, dockerfile string, cli ContainerCli, verbose bool) (string, error) {
	image := imageName(name, suffix)

	imageExists, ierr := exists(image, "image", cli, verbose)
	if ierr != nil {
		return "", ierr
	}

	manifestExists, merr := exists(image, "manifest", cli, verbose)
	if merr != nil {
		return "", merr
	}

	if imageExists && !manifestExists {
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

	return buildIt(dir, name, suffix, dockerfile, "manifest", cli, verbose)
}

func buildDev(dir, name, suffix, dockerfile string, cli ContainerCli, verbose bool) (string, error) {
	image := imageName(name, suffix)

	if manifestExists, err := exists(image, "manifest", cli, verbose); err != nil {
		return "", err
	} else if manifestExists {
		fmt.Fprintf(os.Stderr, "Removing prior manifest from prod builds %s\n", image)
		if err := rm(image, "manifest", cli, verbose); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, suffix, dockerfile, "image", cli, verbose)
}

func buildImage(dir, name, suffix, dockerfile string, cli ContainerCli, opts BuildOptions) (string, error) {
	if opts.Production {
		return buildProd(dir, name, suffix, dockerfile, cli, opts.Verbose)
	} else {
		return buildDev(dir, name, suffix, dockerfile, cli, opts.Verbose)
	}
}

func buildAndPushImage(dir, name, suffix, dockerfile string, cli ContainerCli, opts BuildOptions) error {
	image, err := buildImage(dir, name, suffix, dockerfile, cli, opts)
	if err != nil {
		return err
	}

	return pushImage(image, cli, opts)
}
