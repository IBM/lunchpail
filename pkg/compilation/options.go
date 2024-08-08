package compilation

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type Options struct {
	Namespace          string   `yaml:",omitempty"`
	RepoSecrets        []string `yaml:"repoSecrets,omitempty"`
	ImagePullSecret    string   `yaml:"imagePullSecret,omitempty"`
	OverrideValues     []string `yaml:"overrideValues,omitempty"`
	OverrideFileValues []string `yaml:"overrideFileValues,omitempty"`
	Queue              string   `yaml:",omitempty"`
	HasGpuSupport      bool     `yaml:"hasGpuSupport,omitempty"`
	DockerHost         string   `yaml:"dockerHost,omitempty"`
	ApiKey             string   `yaml:"apiKey,omitempty"`
	ResourceGroupID    string   `yaml:"resourceGroupID,omitempty"`
	SSHKeyType         string   `yaml:"SSHKeyType,omitempty"`
	PublicSSHKey       string   `yaml:"publicSSHKey,omitempty"`
	Zone               string   `yaml:"zone,omitempty"`
	Profile            string   `yaml:"profile,omitempty"`
	ImageID            string   `yaml:"imageID,omitempty"`
	CreateNamespace    bool     `yaml:"createNamespace,omitempty"`
}

func optionsPath(appTemplatePath string) string {
	return filepath.Join(appTemplatePath, "compilationOptions.json")
}

func SaveOptions(appTemplatePath string, opts Options) error {
	if serialized, err := json.Marshal(opts); err != nil {
		return err
	} else {
		return os.WriteFile(optionsPath(appTemplatePath), serialized, 0644)
	}
}

func RestoreOptions(appTemplatePath string) (Options, error) {
	var compilationOptions Options

	if _, err := os.Stat(optionsPath(appTemplatePath)); err != nil {
		// no shrinkwrapped options
		return compilationOptions, nil
	}

	jsonFile, err := os.Open(optionsPath(appTemplatePath))
	if err != nil {
		return compilationOptions, err
	} else {
		defer jsonFile.Close()
	}

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return compilationOptions, err
	}

	if err := json.Unmarshal(byteValue, &compilationOptions); err != nil {
		return compilationOptions, err
	}

	return compilationOptions, nil
}
