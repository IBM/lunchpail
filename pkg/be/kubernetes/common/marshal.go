package common

import (
	"lunchpail.io/pkg/ir/llir"
)

func MarshalCommonResources(ir llir.LLIR, verbose bool) ([]string, error) {
	yamls := []string{ir.AppProvidedKubernetesResources}

	return yamls, nil
}
