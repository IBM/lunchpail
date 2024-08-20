package kubernetes

import (
	"fmt"

	"lunchpail.io/pkg/be/kubernetes/shell"
	"lunchpail.io/pkg/ir/llir"
	util "lunchpail.io/pkg/util/yaml"
)

func MarshalComponent(ir llir.LLIR, c llir.Component, verbose bool) (string, error) {
	switch cc := c.(type) {
	case llir.ShellComponent:
		return shell.Template(ir, cc, verbose)
	}

	return "", fmt.Errorf("Unsupported component type")
}

func MarshalArray(ir llir.LLIR, verbose bool) ([]string, error) {
	yamls := []string{ir.K8sCommonResources}

	for _, c := range ir.Components {
		yaml, err := MarshalComponent(ir, c, verbose)
		if err != nil {
			return []string{}, err
		}

		yamls = append(yamls, yaml)
	}

	return yamls, nil
}

// This is to present a single string form of all of the yaml,
// e.g. for dry-running.
func Marshal(ir llir.LLIR, verbose bool) (string, error) {
	if a, err := MarshalArray(ir, verbose); err != nil {
		return "", err
	} else {
		return util.Join(a), nil
	}
}

func MarshalComponentArray(ir llir.LLIR, c llir.Component, verbose bool) (string, error) {
	yamls := []string{ir.K8sCommonResources}
	// yamls = append(yamls, c.Config)

	yaml, err := MarshalComponent(ir, c, verbose)
	if err != nil {
		return "", err
	}
	yamls = append(yamls, yaml)

	return util.Join(yamls), nil
}
