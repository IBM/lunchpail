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

type filesystemBuilder struct {
	appname string
	verbose bool
}

// Formulate an HLIR for the source in the given `sourcePath`
// filesystem and write it out to the `templatePath`
func copyFilesystemIntoTemplate(appname, sourcePath, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose() {
		fmt.Fprintln(os.Stderr, "Copying application source into", appdir(templatePath))
	}

	appVersion, app, err := filesystemBuilder{appname, opts.Verbose()}.scan(sourcePath)
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

func (_ filesystemBuilder) readString(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(b)), nil
}

// Formulate an HLIR for the source in the given `sourcePath`
func (b filesystemBuilder) scan(sourcePath string) (appVersion string, app hlir.Application, err error) {
	app = hlir.NewWorkerApplication(b.appname)
	spec := &app.Spec

	// Handle top-level metadata files. Must come before addCode() due to handling of spec.Image and spec.Command.
	if appVersion, err = b.addMetadata(spec, sourcePath); err != nil {
		return
	}

	// Handle src/ artifacts
	if err = b.addCode(spec, sourcePath); err != nil {
		return
	}

	// Handle blob/ artifacts
	if err = b.addBlobs(spec, filepath.Join(sourcePath, "blobs/base64"), "application/base64"); err != nil {
		return
	}
	if err = b.addBlobs(spec, filepath.Join(sourcePath, "blobs/plain"), ""); err != nil {
		return
	}

	b.correctPythonNeedsVersion(spec)

	return
}

func (b filesystemBuilder) addBlobs(spec *hlir.Spec, blobsPrefix, encoding string) error {
	if _, err := os.Stat(blobsPrefix); err != nil {
		// no such blobs
		return nil
	}

	if b.verbose {
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

		if b.verbose {
			fmt.Fprintf(os.Stderr, "Incorporating blob artifact %s with encoding='%s'\n", name, encoding)
		}

		spec.Datasets = append(spec.Datasets, hlir.Dataset{Name: name, Blob: hlir.Blob{Encoding: encoding, Content: string(content)}})

		return nil
	})
}

// Handle src/ artifacts
func (b filesystemBuilder) addCode(spec *hlir.Spec, sourcePath string) (err error) {
	maybeCommand := ""
	maybeImage := ""

	srcPrefix := filepath.Join(sourcePath, "src")
	if _, err = os.Stat(srcPrefix); err == nil {
		if b.verbose {
			fmt.Fprintln(os.Stderr, "Scanning for source files", srcPrefix)
		}
		err = filepath.WalkDir(srcPrefix, func(path string, d fs.DirEntry, err error) error {
			if d.IsDir() {
				return nil
			} else if b.verbose {
				fmt.Fprintln(os.Stderr, "Incorporating source file", path)
			}

			source, err := b.readString(path)
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

	if spec.Command == "" && maybeCommand != "" {
		spec.Command = maybeCommand
	}
	if spec.Image == "" && maybeImage != "" {
		spec.Image = maybeImage
	}

	return
}

// Handle top-level metadata files
func (b filesystemBuilder) addMetadata(spec *hlir.Spec, sourcePath string) (appVersion string, err error) {
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
				if req, rerr := b.readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.Needs = append(spec.Needs, hlir.Needs{Name: "python", Version: "latest", Requirements: req})
				}
			case "memory", "memory.txt":
				if mem, rerr := b.readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.MinMemory = mem
				}
			case "image":
				if image, rerr := b.readString(path); rerr != nil {
					err = rerr
					return
				} else {
					spec.Image = image
				}
			case "command":
				if command, rerr := b.readString(path); rerr != nil {
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
				if b.verbose {
					fmt.Fprintln(os.Stderr, "Skipping application artifact", strings.Replace(path, sourcePath, "", 1))
				}
			}
		}
	}

	return
}

// If we now know the specific python version needed (e.g. because of
// a given command or image file), we can update the Needs spec. TODO:
// handle version from image.
func (b filesystemBuilder) correctPythonNeedsVersion(spec *hlir.Spec) {
	pyNeedsIdx := slices.IndexFunc(spec.Needs, func(n hlir.Needs) bool { return n.Name == "python" && n.Version == "latest" })
	if pyNeedsIdx >= 0 && strings.HasPrefix(spec.Command, "python3") {
		version := regexp.MustCompile("\\d.\\d+").FindString(spec.Command)
		if version != "" {
			if b.verbose {
				fmt.Fprintln(os.Stderr, "Using Python version", version)
			}
			spec.Needs[pyNeedsIdx].Version = version
		}
	}
}
