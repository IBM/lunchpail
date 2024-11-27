package kubernetes

import (
	"lunchpail.io/pkg/be/kubernetes/common"
	"lunchpail.io/pkg/be/kubernetes/shell"
	"lunchpail.io/pkg/ir/llir"
	util "lunchpail.io/pkg/util/yaml"
)

// Marshal one component.
func marshalComponent(ir llir.LLIR, c llir.ShellComponent, namespace string, opts common.Options) (string, error) {
	return shell.Template(ir, c, namespace, opts)
}

// Marshal all components, including the common resources needed to
// make them function in a cluster.
func MarshalAllComponents(ir llir.LLIR, namespace string, opts common.Options) ([]string, error) {
	yamls, err := common.MarshalCommonResources(ir, namespace, opts)
	if err != nil {
		return []string{}, err
	}

	for _, c := range ir.Components {
		yaml, err := marshalComponent(ir, c, namespace, opts)
		if err != nil {
			return []string{}, err
		}

		yamls = append(yamls, yaml)
	}

	return yamls, nil
}

// This is to present a single string form of all of the yaml,
// e.g. for dry-running.
func (backend Backend) DryRun(ir llir.LLIR, copts llir.Options) (string, error) {
	opts := common.Options{Options: copts}
	if arr, err := MarshalAllComponents(ir, backend.namespace, opts); err != nil {
		return "", err
	} else {
		return util.Join(arr), nil
	}
}

// marshal resources for this component, including common resources
// needed to make it function on its own in a cluster.
func MarshalComponentAsStandalone(ir llir.LLIR, c llir.ShellComponent, namespace string, opts common.Options) (string, error) {
	yamls, err := common.MarshalCommonResources(ir, namespace, opts)
	if err != nil {
		return "", err
	}

	// yamls = append(yamls, c.Config)

	yaml, err := marshalComponent(ir, c, namespace, opts)
	if err != nil {
		return "", err
	}
	yamls = append(yamls, yaml)

	return util.Join(yamls), nil
}
