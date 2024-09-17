package common

import "lunchpail.io/pkg/ir/llir"

func MarshalCommonResources(ir llir.LLIR, namespace string, opts Options) ([]string, error) {
	yamls := []string{}

	if len(ir.AppProvidedKubernetesResources) > 0 {
		yamls = append(yamls, ir.AppProvidedKubernetesResources)
	}

	if yaml, err := templateLunchpailCommonResources(ir, namespace, opts); err != nil {
		return []string{}, err
	} else {
		yamls = append(yamls, yaml)
	}

	return yamls, nil
}
