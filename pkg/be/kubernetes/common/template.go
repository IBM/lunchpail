package common

import (
	"embed"
	"fmt"
	"io/ioutil"
	"os"

	"lunchpail.io/pkg/be/helm"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

func templateLunchpailCommonResources(ir llir.LLIR, namespace string, opts Options) (string, error) {
	templatePath, err := stage(appTemplate, appTemplateFile)
	if err != nil {
		return "", err
	} else if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Templating Kubernetes common components to %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	values, err := Values(ir, opts)
	if err != nil {
		return "", err
	}

	return helm.Template(
		ir.RunName+"-common",
		namespace,
		templatePath,
		"", // no yaml values at the moment
		helm.TemplateOptions{Verbose: opts.Log.Verbose, OverrideValues: values},
	)
}

// TODO share this with ../shell/stage.go
func stage(fs embed.FS, file string) (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, fs, file); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}
