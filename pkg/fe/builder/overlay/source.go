package overlay

import (
	"encoding/base64"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"

	"gopkg.in/yaml.v3"

	"lunchpail.io/pkg/ir/hlir"
)

// Formulate an HLIR for the source in the given `sourcePath` and write it out to the `templatePath`
func copySourceIntoTemplate(appname, sourcePath, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose() {
		fmt.Fprintln(os.Stderr, "Copying application source into", appdir(templatePath))
	}

	appVersion, app, err := applicationFromSource(appname, sourcePath, templatePath, opts)
	if err != nil {
		return "", err
	}

	b, err := yaml.Marshal(app)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(filepath.Join(appdir(templatePath), "app.yaml"), b, 0644); err != nil {
		return "", err
	}

	return appVersion, nil
}

func readString(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(b)), nil
}

// Formulate an HLIR for the source in the given `sourcePath`
func applicationFromSource(appname, sourcePath, templatePath string, opts Options) (appVersion string, app hlir.Application, err error) {
	app = hlir.NewWorkerApplication(appname)
	spec := &app.Spec

	maybeImage := ""
	maybeCommand := ""

	// Handle src/ artifacts
	srcPrefix := filepath.Join(sourcePath, "src")
	if _, err = os.Stat(srcPrefix); err == nil {
		if opts.Verbose() {
			fmt.Fprintln(os.Stderr, "Scanning for source files", srcPrefix)
		}
		err = filepath.WalkDir(srcPrefix, func(path string, d fs.DirEntry, err error) error {
			if d.IsDir() {
				return nil
			} else if opts.Verbose() {
				fmt.Fprintln(os.Stderr, "Incorporating source file", path)
			}

			source, err := readString(path)
			if err != nil {
				return err
			}
			spec.Code = append(spec.Code, hlir.Code{Name: d.Name(), Source: source})

			switch d.Name() {
			case "main.sh":
				maybeCommand = "./main.sh"
				maybeImage = "docker.io/alpine:3"
			case "main.py":
				maybeCommand = "python3 main.py"
				maybeImage = "docker.io/python:3.12"
			}
			return nil
		})
	}

	// Handle blob/ artifacts
	if err = addBlobs(spec, filepath.Join(sourcePath, "blobs/base64"), "application/base64", opts); err != nil {
		return
	}
	if err = addBlobs(spec, filepath.Join(sourcePath, "blobs/plain"), "", opts); err != nil {
		return
	}

	// Handle top-level metadata files
	var topLevelFiles []fs.DirEntry
	if topLevelFiles, err = os.ReadDir(sourcePath); err == nil {
		for _, d := range topLevelFiles {
			path := filepath.Join(sourcePath, d.Name())
			switch d.Name() {
			case "version", "version.txt":
				if appVersion, err = handleVersionFile(path); err != nil {
					return
				}
			case "requirements.txt":
				if req, rerr := readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.Needs = append(spec.Needs, hlir.Needs{Name: "python", Version: "latest", Requirements: req})
				}
			case "memory", "memory.txt":
				if mem, rerr := readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.MinMemory = mem
				}
			case "image":
				if image, rerr := readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.Image = image
				}
			case "command":
				if command, rerr := readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.Command = command
				}
			case "env.yaml":
				if b, rerr := os.ReadFile(path); rerr != nil {
					err = rerr
					return
				} else if rerr := yaml.Unmarshal(b, &spec.Env); rerr != nil {
					err = fmt.Errorf("Error parsing env.yaml: %v", rerr)
					return
				}
			default:
				if opts.Verbose() {
					fmt.Fprintln(os.Stderr, "Skipping application artifact", strings.Replace(path, sourcePath, "", 1))
				}
			}
		}
	}

	if spec.Command == "" && maybeCommand != "" {
		spec.Command = maybeCommand
	}
	if spec.Image == "" && maybeImage != "" {
		spec.Image = maybeImage
	}

	pyNeedsIdx := slices.IndexFunc(spec.Needs, func(n hlir.Needs) bool { return n.Name == "python" && n.Version == "latest" })
	if pyNeedsIdx >= 0 && strings.HasPrefix(spec.Command, "python3") {
		version := regexp.MustCompile("\\d.\\d+").FindString(spec.Command)
		if version != "" {
			if opts.Verbose() {
				fmt.Fprintln(os.Stderr, "Using Python version", version)
			}
			spec.Needs[pyNeedsIdx].Version = version
		}
	}

	return
}

func addBlobs(spec *hlir.Spec, blobsPrefix, encoding string, opts Options) error {
	if _, err := os.Stat(blobsPrefix); err != nil {
		// no such blobs
		return nil
	}

	if opts.Verbose() {
		fmt.Fprintln(os.Stderr, "Scanning for blob artifacts", blobsPrefix)
	}

	return filepath.WalkDir(blobsPrefix, func(path string, d fs.DirEntry, err error) error {
		if d.IsDir() {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		name, err := filepath.Rel(blobsPrefix, path)
		if err != nil {
			return err
		}

		if encoding == "application/base64" {
			dst := make([]byte, base64.StdEncoding.EncodedLen(len(content)))
			base64.StdEncoding.Encode(dst, content)
			content = dst
		}

		if opts.Verbose() {
			fmt.Fprintf(os.Stderr, "Incorporating blob artifact %s with encoding='%s'\n", name, encoding)
		}

		spec.Datasets = append(spec.Datasets, hlir.Dataset{Name: name, Blob: hlir.Blob{Encoding: encoding, Content: string(content)}})

		return nil
	})
}
