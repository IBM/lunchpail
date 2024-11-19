package overlay

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"

	"lunchpail.io/pkg/ir/hlir"
)

// Support for build --command
func copyCommandIntoTemplate(appname, command, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Copying command into %s\n", appdir(templatePath))
	}

	err = os.MkdirAll(appdir(templatePath), 0755)
	if err != nil {
		return
	}

	app := commandApp(command, opts)
	err = writeCommandAppToTemplateDir(app, appdir(templatePath), opts.Verbose)

	return
}

func commandApp(command string, opts Options) hlir.HLIR {
	app := hlir.NewWorkerApplication("command")
	app.Spec.Command = "./main.sh"
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: fmt.Sprintf(`#!/bin/sh
%s`, command),
		},
	}

	app.Spec.Image = "docker.io/alpine:3"
	if opts.BuildOptions.ImageID != "" {
		// TODO is ImageId what we want here?
		app.Spec.Image = opts.BuildOptions.ImageID
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
	}
}

func writeCommandAppToTemplateDir(ir hlir.HLIR, dir string, verbose bool) error {
	appdir := filepath.Join(dir, "applications")
	if err := os.MkdirAll(appdir, 0755); err != nil {
		return err
	}
	for _, app := range ir.Applications {
		yaml, err := yaml.Marshal(app)
		if err != nil {
			return err
		}

		if err := os.WriteFile(filepath.Join(appdir, app.Metadata.Name+".yaml"), yaml, 0644); err != nil {
			return err
		}
	}

	return nil
}
