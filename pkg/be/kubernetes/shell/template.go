package shell

import (
	"fmt"
	"os"

	templater "lunchpail.io/pkg/fe/template"
	"lunchpail.io/pkg/ir/llir"
)

func Template(ir llir.LLIR, c llir.ShellComponent, verbose bool) (string, error) {
	templatePath, err := stage(template, templateFile)
	if err != nil {
		return "", err
	} else if verbose {
		fmt.Fprintf(os.Stderr, "Shell stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	parts, err := templater.Template(
		ir.RunName+"-"+string(c.Component),
		ir.Namespace,
		templatePath,
		ir.Values.Yaml,
		templater.TemplateOptions{Verbose: verbose, OverrideValues: c.Values},
	)

	if err != nil {
		return "", err
	}

	return parts, nil
}
