package lunchpail

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type AppOptions struct {
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
	return filepath.Join(appTemplatePath, "appOptions.json")
}

func SaveAppOptions(appTemplatePath string, opts AppOptions) error {
	if serialized, err := json.Marshal(opts); err != nil {
		return err
	} else {
		return os.WriteFile(optionsPath(appTemplatePath), serialized, 0644)
	}
}

func RestoreAppOptions(appTemplatePath string) (AppOptions, error) {
	var appOptions AppOptions

	if _, err := os.Stat(optionsPath(appTemplatePath)); err != nil {
		// no shrinkwrapped options
		return appOptions, nil
	}

	jsonFile, err := os.Open(optionsPath(appTemplatePath))
	if err != nil {
		return appOptions, err
	} else {
		defer jsonFile.Close()
	}

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return appOptions, err
	}

	if err := json.Unmarshal(byteValue, &appOptions); err != nil {
		return appOptions, err
	}

	return appOptions, nil
}
