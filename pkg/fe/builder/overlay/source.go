package overlay

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"

	"lunchpail.io/pkg/ir/hlir"
)

func copySourceIntoTemplate(appname, sourcePath, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose() {
		fmt.Fprintln(os.Stderr, "Copying application source into", appdir(templatePath))
	}

	appVersion, err = addHLIRFromSource(appname, sourcePath, templatePath, opts)
	return
}

func addHLIRFromSource(appname, sourcePath, templatePath string, opts Options) (string, error) {
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

func applicationFromSource(appname, sourcePath, templatePath string, opts Options) (appVersion string, app hlir.Application, err error) {
	app = hlir.NewWorkerApplication(appname)
	spec := &app.Spec

	filepath.WalkDir(sourcePath, func(path string, d fs.DirEntry, err error) error {
		switch {
		case d.IsDir():
			// skip directories
		case filepath.Ext(path) == ".html" || filepath.Ext(path) == ".gz" || filepath.Ext(path) == ".zip" || filepath.Ext(path) == ".parquet":
			// skip data files
		default:
			b, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			switch d.Name() {
			case "version", "version.txt":
				if appVersion, err = handleVersionFile(path); err != nil {
					return err
				}
			case "requirements.txt":
				spec.Needs = append(spec.Needs, hlir.Needs{Name: "python", Version: "latest", Requirements: string(b)})
			default:
				spec.Code = append(spec.Code, hlir.Code{Name: d.Name(), Source: string(b)})
			}

			switch d.Name() {
			case "main.sh":
				spec.Command = "./main.sh"
				spec.Image = "docker.io/alpine:3"
			case "main.py":
				spec.Command = "python3 main.py"
				spec.Image = "docker.io/python:3.12"
			}
		}

		return nil
	})

	return
}
