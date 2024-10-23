package overlay

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"

	"lunchpail.io/pkg/ir/hlir"
)

// Support for build --eval
func copyEvalIntoTemplate(appname, eval, templatePath string, verbose bool) (appVersion string, err error) {
	if verbose {
		fmt.Fprintf(os.Stderr, "Copying eval into %s\n", appdir(templatePath))
	}

	err = os.MkdirAll(appdir(templatePath), 0755)
	if err != nil {
		return
	}

	app := evalApp(eval, verbose)

	err = writeAppToTemplateDir(app, appdir(templatePath), verbose)

	return
}

func evalApp(eval string, verbose bool) hlir.HLIR {
	app := hlir.NewApplication("eval")
	app.Spec.Role = "worker"
	app.Spec.Command = "./main.sh"
	app.Spec.Image = "docker.io/alpine:3" // TODO allow passing this in
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: fmt.Sprintf(`#!/bin/sh
%s`, eval),
		},
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
		WorkerPools:  []hlir.WorkerPool{hlir.NewPool("eval", 1)},
	}
}

func writeAppToTemplateDir(ir hlir.HLIR, dir string, verbose bool) error {
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

	pooldir := filepath.Join(dir, "workerpools")
	if err := os.MkdirAll(pooldir, 0755); err != nil {
		return err
	}
	for _, pool := range ir.WorkerPools {
		yaml, err := yaml.Marshal(pool)
		if err != nil {
			return err
		}

		if err := os.WriteFile(filepath.Join(pooldir, pool.Metadata.Name+".yaml"), yaml, 0644); err != nil {
			return err
		}
	}

	return nil
}
