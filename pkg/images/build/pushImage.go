package build

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
)

func pushIt(image string, kind ImageOrManifest, cli ContainerCli) error {
	cmd := exec.Command(string(cli), string(kind), "push", image)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}

func loadIntoKindForDocker(image string) error {
	clusterName := "jaas" // TODO

	cmd := exec.Command("kind", "load", "docker-image", "-n", clusterName, image)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}

func loadIntoKindForImageArchive(archiveFile string) error {
	clusterName := "jaas" // TODO

	cmd := exec.Command("kind", "-n", clusterName, "load", "image-archive", archiveFile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}

func saveImageToImageArchive(image string) (string, error) {
	if tmpfile, err := ioutil.TempFile("", "lunchpail"); err != nil {
		return "", err
	} else {
		cmd := exec.Command("podman", "save", image, "-o", tmpfile.Name())
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			return "", err
		}
		if err := cmd.Wait(); err != nil {
			return "", err
		}

		return tmpfile.Name(), nil
	}
}

func loadIntoKindForPodman(image string) error {
	if archiveFile, err := saveImageToImageArchive(image); err != nil {
		return err
	} else {
		defer os.Remove(archiveFile)
		return loadIntoKindForImageArchive(archiveFile)
	}

	return nil
}

func imageWithoutTag(image string) string {
	if colonIdx := strings.Index(image, ":"); colonIdx != -1 {
		return image[:colonIdx]
	} else {
		return image
	}
}

func podmanCurHash(image, tag string) ([]byte, error) {
	//             curhash=$($SUDO podman exec -it ${CLUSTER_NAME}-control-plane crictl images | grep "$image2 " | grep $VERSION | awk '{print $3}' | head -c 12 || echo "nope")
	clusterName := "jaas" // TODO
	podName := clusterName + "-control-plane"

	if out, err := exec.Command("sh", "-c", "podman exec "+podName+" crictl images | grep "+image+" | grep "+tag+" | awk '{print $3}' | head -c 12 || echo nope").Output(); err != nil {
		return nil, err
	} else {
		return out, nil
	}
}

func podmanNewHash(image, tag string) ([]byte, error) {
	//             newhash=$(podman image ls | grep "$image2 " | grep $VERSION | awk '{print $3}' | head -c 12 || echo "nope2")
	if out, err := exec.Command("sh", "-c", "podman image ls | grep "+image+" | grep "+tag+" | awk '{print $3}' | head -c 12 || echo nope2").Output(); err != nil {
		return nil, err
	} else {
		return out, nil
	}
}

func pushImage(image string, cli ContainerCli, opts BuildOptions) error {
	if opts.Production {
		// for production builds, push built manifest
		return pushIt(image, "manifest", cli)
	} else if cli == "podman" {
		parts := strings.Split(image, ":")
		imageName := parts[0]
		tag := parts[1]

		curhash, err1 := podmanCurHash(imageName, tag)
		newhash, err2 := podmanNewHash(imageName, tag)
		if err1 != nil {
			return err1
		} else if err2 != nil {
			return err2
		} else if !bytes.Equal(curhash, newhash) {
			fmt.Printf("pushing %s %s %s\n", imageName, curhash, newhash)
			if err := loadIntoKindForPodman(image); err != nil {
				return err
			}
		} else {
			fmt.Printf("already pushed %s\n", imageName)
		}

		return nil
	} else {
		return loadIntoKindForDocker(image)
	}
}
