package shell

import (
	"encoding/base64"
	"fmt"
	"path/filepath"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/util"
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

func dataBlobFromLiteral(dataBlob []hlir.Dataset) (data, string) {
	data_blob := data{}
	mountPath := ""

	for _, dataset := range dataBlob {
		name := dataset.Name

		if dataset.Blob.Content != "" {
			mountPath = filepath.Dir(name)
			if dataset.MountPath != "" {
				mountPath = dataset.MountPath
			}

			key := filepath.Base(name)
			content := []byte(dataset.Blob.Content)
			switch dataset.Blob.Encoding {
			case "application/base64":
				if c, err := base64.StdEncoding.DecodeString(dataset.Blob.Content); err != nil {
					return nil, ""
				} else {
					content = c
				}
			}
			data_blob[key] = string(content)
		}
	}
	return data_blob, mountPath
}

func code(application hlir.Application) (data, string, string, error) {
	var d data
	var blob data
	var mount_path string
	var blob_path string

	if len(application.Spec.Code) > 0 {
		// then the Application specifies a `spec.code` literal
		// (i.e. inlined code directly in the Application yaml)
		d, mount_path = codeFromLiteral(application.Spec.Code)

	} else if application.Spec.Command == "" {
		return data{}, "", "", fmt.Errorf("Application spec is missing either `code` or `repo` field")
	} else {
		return data{}, "", "", nil
	}

	if len(application.Spec.Datasets) > 0 {
		blob, blob_path = dataBlobFromLiteral(application.Spec.Datasets)
		for k, v := range blob { //merge blob data into the main data map
			d[k] = v
		}
	}
	return d, mount_path, blob_path, nil
}

func codeB64(application hlir.Application) (string, string, string, error) {
	data, mountPath, blobPath, err := code(application)
	if err != nil {
		return "", "", "", err
	}

	ds, err := util.ToJsonB64(data)
	return ds, mountPath, blobPath, err
}
