package compilation

import (
	_ "embed"
	"encoding/json"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/be/target"
)

type TargetOptions struct {
	Namespace string
	target.Platform
}

type LogOptions struct {
	Verbose bool
	Debug   bool
}

type Options struct {
	Target *TargetOptions
	Log    *LogOptions

	ImagePullSecret    string   `yaml:"imagePullSecret,omitempty"`
	OverrideValues     []string `yaml:"overrideValues,omitempty"`
	OverrideFileValues []string `yaml:"overrideFileValues,omitempty"`
	Queue              string   `yaml:",omitempty"`
	HasGpuSupport      bool     `yaml:"hasGpuSupport,omitempty"`
	ApiKey             string   `yaml:"apiKey,omitempty"`
	ResourceGroupID    string   `yaml:"resourceGroupID,omitempty"`
	SSHKeyType         string   `yaml:"SSHKeyType,omitempty"`
	PublicSSHKey       string   `yaml:"publicSSHKey,omitempty"`
	Zone               string   `yaml:"zone,omitempty"`
	Profile            string   `yaml:"profile,omitempty"`
	ImageID            string   `yaml:"imageID,omitempty"`
	CreateNamespace    bool     `yaml:"createNamespace,omitempty"`
}

//go:embed compilationOptions.json
var valuesJson []byte

func saveOptions(stagedir string, opts Options) error {
	if serialized, err := json.Marshal(opts); err != nil {
		return err
	} else {
		return os.WriteFile(filepath.Join(stagedir, "pkg/compilation/compilationOptions.json"), serialized, 0644)
	}
}

func RestoreOptions() (Options, error) {
	var compilationOptions Options

	if err := json.Unmarshal(valuesJson, &compilationOptions); err != nil {
		return compilationOptions, err
	}

	return compilationOptions, nil
}

// Overlay command line args with options from shrinkwrap (i.e. RestoreOptions)
func RestoreOptionsWithCliOverlay(cliOpts Options) (Options, error) {
	compiledOpts, err := RestoreOptions()
	if err != nil {
		return cliOpts, err
	} else {
		return cliOpts.overlay(compiledOpts), nil
	}
}

func either(a string, b string) string {
	if b == "" {
		return a
	}
	return b
}

func eitherPlatform(a target.Platform, b target.Platform) target.Platform {
	if b == "" {
		return a
	}
	return b
}

func eitherB(a bool, b bool) bool {
	return b || a
}

func (cliOpts Options) overlay(compiledOpts Options) Options {
	cliOpts.Queue = either(compiledOpts.Queue, cliOpts.Queue)
	cliOpts.ImagePullSecret = either(compiledOpts.ImagePullSecret, cliOpts.ImagePullSecret)
	cliOpts.Target = &TargetOptions{
		Platform:  eitherPlatform(compiledOpts.Target.Platform, cliOpts.Target.Platform),
		Namespace: either(compiledOpts.Target.Namespace, cliOpts.Target.Namespace),
	}

	// TODO here... how do we determine that boolean values were unset?
	cliOpts.HasGpuSupport = eitherB(compiledOpts.HasGpuSupport, cliOpts.HasGpuSupport)
	cliOpts.CreateNamespace = eitherB(compiledOpts.CreateNamespace, cliOpts.CreateNamespace)

	// careful: `--set x=3 --set x=4` results in x having
	// value 4, so we need to place the compiled
	// options first in the list
	cliOpts.OverrideValues = append(compiledOpts.OverrideValues, cliOpts.OverrideValues...)
	cliOpts.OverrideFileValues = append(compiledOpts.OverrideFileValues, cliOpts.OverrideFileValues...)

	return cliOpts
}
