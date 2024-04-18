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

func exists(name string, kind ImageOrManifest, cli ContainerCli) (bool, error) {
	cmd := exec.Command(string(cli), string(kind), "exists", name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return false, err
	}
	if err := cmd.Wait(); err != nil {
		// image does not exist
		return false, nil
	}

	return true, nil
}

func rm(name string, kind ImageOrManifest, cli ContainerCli) error {
	cmd := exec.Command(string(cli), string(kind), "rm", name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		// image does not exist
		return err
	}

	return nil
}

func createManifest(name string, cli ContainerCli) error {
	cmd := exec.Command(string(cli), "manifest", "create", name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		// image does not exist
		return err
	}

	return nil
}

func buildIt(dir, name, suffix, dockerfile string, kind ImageOrManifest, cli ContainerCli) (string, error) {
	imageRegistry := "ghcr.io" // TODO
	imageRepo := "lunchpail"   // TODO
	version := lunchpail.Version()
	provider := "jaas"

	image := filepath.Join(imageRegistry, imageRepo, provider+"-"+name+suffix+":"+version)

	var cmd *exec.Cmd
	if kind == "maniefst" {
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
		// image does not exist
		return "", err
	}

	return image, nil

	// TODO --build-arg registry=$IMAGE_REGISTRY --build-arg repo=$IMAGE_REPO --build-arg version=$VERSION \
}

func buildProd(dir, name, suffix, dockerfile string, cli ContainerCli) (string, error) {
	imageExists, ierr := exists(name, "image", cli)
	if ierr != nil {
		return "", ierr
	}

	manifestExists, merr := exists(name, "manifest", cli)
	if merr != nil {
		return "", merr
	}

	if imageExists && !manifestExists {
		// we have a previously built image that is not a manifest
		fmt.Fprintf(os.Stderr, "Clearing out prior non-manifest image %s\n", name)
		if err := rm(name, "image", cli); err != nil {
			return "", err
		}
	}

	if !manifestExists {
		if err := createManifest(name, cli); err != nil {
			return "", err
		}
	}

	return buildIt(dir, name, suffix, dockerfile, "manifest", cli)
}

func buildDev(dir, name, suffix, dockerfile string, cli ContainerCli) (string, error) {
	if manifestExists, err := exists(name, "manifest", cli); err != nil {
		return "", err
	} else if manifestExists {
		fmt.Fprintf(os.Stderr, "Removing prior manifest from prod builds %s\n", name)
		if err := rm(name, "manifest", cli); err != nil {
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
