package overlay

import (
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

	// While walking the directory structure, these are the noteworthy subdirectories
	srcPrefix := filepath.Join(sourcePath, "src")

	err = filepath.WalkDir(sourcePath, func(path string, d fs.DirEntry, err error) error {
		switch {
		case d.IsDir():
			// skip directories, except to remember which "mode" we are in
		case filepath.Ext(path) == ".pdf" || filepath.Ext(path) == ".html" || filepath.Ext(path) == ".gz" || filepath.Ext(path) == ".zip" || filepath.Ext(path) == ".parquet":
			// skip data files; TODO add support for .ignore
		case path[len(path)-1] == '~':
			// skip emacs temporary files
		default:
			if strings.HasPrefix(path, srcPrefix) {
				// Handle src/ artifacts
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
			}

			// Handle non-src artifacts
			switch d.Name() {
			case "version", "version.txt":
				if appVersion, err = handleVersionFile(path); err != nil {
					return err
				}
			case "requirements.txt":
				req, err := readString(path)
				if err != nil {
					return err
				}
				spec.Needs = append(spec.Needs, hlir.Needs{Name: "python", Version: "latest", Requirements: req})
			case "memory", "memory.txt":
				mem, err := readString(path)
				if err != nil {
					return err
				}
				spec.MinMemory = mem
			case "image":
				image, err := readString(path)
				if err != nil {
					return err
				}
				spec.Image = image
			case "command":
				command, err := readString(path)
				if err != nil {
					return err
				}
				spec.Command = command
			case "env.yaml":
				if b, err := os.ReadFile(path); err != nil {
					return err
				} else if err := yaml.Unmarshal(b, &spec.Env); err != nil {
					return fmt.Errorf("Error parsing env.yaml: %v", err)
				}
			default:
				if opts.Verbose() {
					fmt.Fprintln(os.Stderr, "Skipping application artifact", strings.Replace(path, sourcePath, "", 1))
				}
			}
		}

		return nil
	})

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
