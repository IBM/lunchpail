package assembly

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type Options struct {
	Namespace          string
	ClusterIsOpenShift bool
	ImagePullSecret    string
	WorkdirViaMount    bool
	OverrideValues     []string
	Queue              string
	HasGpuSupport      bool
	DockerHost         string
}

func optionsPath(appTemplatePath string) string {
	return filepath.Join(appTemplatePath, "assemblyOptions.json")
}

func SaveOptions(appTemplatePath string, opts Options) error {
	if serialized, err := json.Marshal(opts); err != nil {
		return err
	} else {
		return os.WriteFile(optionsPath(appTemplatePath), serialized, 0644)
	}
}

func RestoreOptions(appTemplatePath string) (Options, error) {
	var assemblyOptions Options

	if _, err := os.Stat(optionsPath(appTemplatePath)); err != nil {
		// no shrinkwrapped options
		return assemblyOptions, nil
	}

	jsonFile, err := os.Open(optionsPath(appTemplatePath))
	if err != nil {
		return assemblyOptions, err
	} else {
		defer jsonFile.Close()
	}

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return assemblyOptions, err
	}

	if err := json.Unmarshal(byteValue, &assemblyOptions); err != nil {
		return assemblyOptions, err
	}

	return assemblyOptions, nil
}
