package shell

import (
	"fmt"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/util"
	"path/filepath"
)

type data map[string]string

func codeFromLiteral(codeSpecs []hlir.Code) (data, string) {
	cm_data := data{}
	cm_mount_path := ""

	for _, codeSpec := range codeSpecs {
		key := filepath.Base(codeSpec.Name)
		cm_mount_path = filepath.Dir(codeSpec.Name) // TODO error checking for differences
		cm_data[key] = codeSpec.Source
	}

	return cm_data, cm_mount_path
}

func code(application hlir.Application) (data, string, error) {
	if len(application.Spec.Code) > 0 {
		// then the Application specifies a `spec.code` literal
		// (i.e. inlined code directly in the Application yaml)
		d, mount_path := codeFromLiteral(application.Spec.Code)
		return d, mount_path, nil
	} else if application.Spec.Command == "" {
		return data{}, "", fmt.Errorf("Application spec is missing either `code` or `repo` field")
	} else {
		return data{}, "", nil
	}
}

func codeB64(application hlir.Application) (string, string, error) {
	data, mountPath, err := code(application)
	if err != nil {
		return "", "", err
	}

	ds, err := util.ToJsonB64(data)
	return ds, mountPath, err
}
