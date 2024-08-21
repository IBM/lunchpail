package kubernetes

import (
	"fmt"

	"lunchpail.io/pkg/be/kubernetes/common"
	"lunchpail.io/pkg/be/kubernetes/shell"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir/llir"
	util "lunchpail.io/pkg/util/yaml"
)

func MarshalComponent(ir llir.LLIR, c llir.Component, opts common.Options, verbose bool) (string, error) {
	switch cc := c.(type) {
	case llir.ShellComponent:
		return shell.Template(ir, cc, opts, verbose)
	}

	return "", fmt.Errorf("Unsupported component type")
}

func MarshalArray(ir llir.LLIR, opts common.Options, verbose bool) ([]string, error) {
	yamls := []string{ir.K8sCommonResources}

	for _, c := range ir.Components {
		yaml, err := MarshalComponent(ir, c, opts, verbose)
		if err != nil {
			return []string{}, err
		}

		yamls = append(yamls, yaml)
	}

	return yamls, nil
}

// This is to present a single string form of all of the yaml,
// e.g. for dry-running.
func DryRun(ir llir.LLIR, cliOpts platform.CliOptions, verbose bool) (string, error) {
	opts := common.Options{CliOptions: cliOpts}
	if a, err := MarshalArray(ir, opts, verbose); err != nil {
		return "", err
	} else {
		return util.Join(a), nil
	}
}

func MarshalComponentArray(ir llir.LLIR, c llir.Component, opts common.Options, verbose bool) (string, error) {
	yamls := []string{ir.K8sCommonResources}
	// yamls = append(yamls, c.Config)

	yaml, err := MarshalComponent(ir, c, opts, verbose)
	if err != nil {
		return "", err
	}
	yamls = append(yamls, yaml)

	return util.Join(yamls), nil
}
