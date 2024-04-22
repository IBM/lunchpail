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

func exists(image string, kind ImageOrManifest, cli ContainerCli) (bool, error) {
	fmt.Printf("%s %s %s %s\n", string(cli), string(kind), "exists", image)
	cmd := exec.Command(string(cli), string(kind), "exists", image)
	cmd.Stdout = os.Stdout
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

func rm(image string, kind ImageOrManifest, cli ContainerCli) error {
	cmd := exec.Command(string(cli), string(kind), "rm", image)
	cmd.Stdout = os.Stdout
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

func createManifest(image string, cli ContainerCli) error {
	cmd := exec.Command(string(cli), "manifest", "create", image)
	cmd.Stdout = os.Stdout
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

func buildIt(dir, name, suffix, dockerfile string, kind ImageOrManifest, cli ContainerCli) (string, error) {
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
	fmt.Printf("Building %s %s in %s %v\n", string(kind), name, dir, cmd)

	cmd.Dir = dir
	cmd.Stdout = os.Stdout
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

func buildProd(dir, name, suffix, dockerfile string, cli ContainerCli) (string, error) {
	image := imageName(name, suffix)

	imageExists, ierr := exists(image, "image", cli)
	if ierr != nil {
		return "", ierr
	}

	manifestExists, merr := exists(image, "manifest", cli)
	if merr != nil {
		return "", merr
	}

	if imageExists && !manifestExists {
		// we have a previously built image that is not a manifest
		fmt.Fprintf(os.Stderr, "Clearing out prior non-manifest image %s\n", image)
		if err := rm(image, "image", cli); err != nil {
			return "", err
		}
	}

	if !manifestExists {
		if err := createManifest(image, cli); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, suffix, dockerfile, "manifest", cli)
}

func buildDev(dir, name, suffix, dockerfile string, cli ContainerCli) (string, error) {
	image := imageName(name, suffix)

	if manifestExists, err := exists(image, "manifest", cli); err != nil {
		return "", err
	} else if manifestExists {
		fmt.Fprintf(os.Stderr, "Removing prior manifest from prod builds %s\n", image)
		if err := rm(image, "manifest", cli); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, suffix, dockerfile, "image", cli)
}

func buildImage(dir, name, suffix, dockerfile string, cli ContainerCli, opts BuildOptions) (string, error) {
	if opts.Production {
		return buildProd(dir, name, suffix, dockerfile, cli)
	} else {
		return buildDev(dir, name, suffix, dockerfile, cli)
	}
}

func buildAndPushImage(dir, name, suffix, dockerfile string, cli ContainerCli, opts BuildOptions) error {
	image, err := buildImage(dir, name, suffix, dockerfile, cli, opts)
	if err != nil {
		return err
	}

	return pushImage(image, cli, opts)
}
