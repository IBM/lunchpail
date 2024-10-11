package shell

import (
	base64 "encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func PrepareWorkdirForComponent(c llir.ShellComponent, opts build.LogOptions) (string, string, error) {
	workdir, err := ioutil.TempDir("", "lunchpail")
	if err != nil {
		return "", "", err
	}

	if opts.Debug {
		fmt.Fprintf(os.Stderr, "Component %v using workdir %s\n", c.C(), workdir)
	}

	for _, code := range c.Application.Spec.Code {
		if opts.Debug {
			fmt.Fprintf(os.Stderr, "Component %v saving code %s (%d bytes)\n", c.C(), code.Name, len(code.Source))
		}
		if err := saveCodeToWorkdir(workdir, code); err != nil {
			return "", "", err
		}
	}

	if err := writeBlobsToWorkdir(c, workdir, opts); err != nil {
		return "", "", err
	}

	command := c.Application.Spec.Command

	return workdir, command, nil
}

func saveCodeToWorkdir(workdir string, code hlir.Code) error {
	return os.WriteFile(filepath.Join(workdir, code.Name), []byte(code.Source), 0700)
}

func writeBlobsToWorkdir(c llir.ShellComponent, workdir string, opts build.LogOptions) error {
	for idx, dataset := range c.Application.Spec.Datasets {
		if dataset.Blob.Content != "" {
			if dataset.Name == "" {
				return fmt.Errorf("Blob %d is missing 'name' in %s", idx, c.Application.Metadata.Name)
			}

			target := filepath.Join(workdir, dataset.Name)
			if dataset.MountPath != "" {
				target = dataset.MountPath
			}

			content := []byte(dataset.Blob.Content)
			switch dataset.Blob.Encoding {
			case "application/base64":
				if c, err := base64.StdEncoding.DecodeString(dataset.Blob.Content); err != nil {
					return err
				} else {
					content = c
				}
			}

			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Writing blob %s\n", target)
			}

			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}

			if err := os.WriteFile(target, []byte(content), 0644); err != nil {
				return err
			}
		}
	}

	return nil
}
