package app

import (
	"fmt"
	"os"
	"os/exec"

	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe/assembler"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/runs"
)

type DownOptions struct {
	Namespace string
	Verbose   bool
}

func deleteNamespace(namespace string) error {
	fmt.Fprintf(os.Stderr, "Removing namespace=%s...", namespace)

	cmd := exec.Command("kubectl", "delete", "ns", namespace)
	if err := cmd.Run(); err != nil {
		return err
	}
	fmt.Fprintln(os.Stderr, "done")

	return nil
}

func Down(runname string, opts DownOptions) error {
	appname := lunchpail.AssembledAppName()
	namespace := appname
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	_, templatePath, err := assembler.Stage(assembler.StageOptions{"", opts.Verbose})
	if err != nil {
		return err
	}

	alsoDeleteNamespace := false

	if runname == "" {
		singletonRun, err := runs.Singleton(appname, namespace)
		if err != nil {
			return err
		}
		runname = singletonRun.Name
		alsoDeleteNamespace = true
	}

	gopts := yaml.GenerateOptions{}
	gopts.CreateNamespace = false

	runname, yaml, overrideValues, err := yaml.Generate(appname, namespace, templatePath, gopts)
	if err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "Uninstalling application in namespace=%s\n", namespace)

	if yaml, err := helm.Template(runname, namespace, templatePath, yaml, helm.TemplateOptions{overrideValues, true, opts.Verbose, true, true}); err != nil {
		return err
	} else if err := kubernetes.Delete(yaml, namespace); err != nil {
		return err
	}

	if alsoDeleteNamespace {
		if err := deleteNamespace(namespace); err != nil {
			return err
		}
	}

	return nil
}
