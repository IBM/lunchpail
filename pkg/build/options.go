package build

import (
	_ "embed"
	"encoding/json"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/be/target"
	"lunchpail.io/pkg/ir/hlir"
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
	Env    map[string]string `yaml:",omitempty"`

	hlir.CallingConvention `yaml:"callingConvention,omitempty"`
	ImagePullSecret        string   `yaml:"imagePullSecret,omitempty"`
	OverrideValues         []string `yaml:"overrideValues,omitempty"`
	OverrideFileValues     []string `yaml:"overrideFileValues,omitempty"`
	Queue                  string   `yaml:",omitempty"`
	HasGpuSupport          bool     `yaml:"hasGpuSupport,omitempty"`
	ApiKey                 string   `yaml:"apiKey,omitempty"`
	ResourceGroupID        string   `yaml:"resourceGroupID,omitempty"`
	SSHKeyType             string   `yaml:"SSHKeyType,omitempty"`
	PublicSSHKey           string   `yaml:"publicSSHKey,omitempty"`
	Zone                   string   `yaml:"zone,omitempty"`
	Profile                string   `yaml:"profile,omitempty"`
	ImageID                string   `yaml:"imageID,omitempty"`
	CreateNamespace        bool     `yaml:"createNamespace,omitempty"`
	Workers                int      `yaml:",omitempty"`

	// Run k concurrent tasks; if k=0 and machine has N cores, then k=N
	Pack int `yaml:",omitempty"`
}

//go:embed buildOptions.json
var valuesJson []byte

func saveOptions(stagedir string, opts Options) error {
	if serialized, err := json.Marshal(opts); err != nil {
		return err
	} else {
		return os.WriteFile(filepath.Join(stagedir, "pkg/build/buildOptions.json"), serialized, 0644)
	}
}

func RestoreOptions() (Options, error) {
	var buildOptions Options

	if err := json.Unmarshal(valuesJson, &buildOptions); err != nil {
		return buildOptions, err
	}

	return buildOptions, nil
}

// Overlay command line args with options from shrinkwrap (i.e. RestoreOptions)
func RestoreOptionsWithCliOverlay(cliOpts Options) (Options, error) {
	builtOpts, err := RestoreOptions()
	if err != nil {
		return cliOpts, err
	} else {
		return cliOpts.overlay(builtOpts), nil
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

func (cliOpts Options) overlay(builtOpts Options) Options {
	cliOpts.Queue = either(builtOpts.Queue, cliOpts.Queue)
	cliOpts.ImagePullSecret = either(builtOpts.ImagePullSecret, cliOpts.ImagePullSecret)
	cliOpts.Target = &TargetOptions{
		Platform:  eitherPlatform(builtOpts.Target.Platform, cliOpts.Target.Platform),
		Namespace: either(builtOpts.Target.Namespace, cliOpts.Target.Namespace),
	}

	// TODO here... how do we determine that boolean values were unset?
	cliOpts.HasGpuSupport = eitherB(builtOpts.HasGpuSupport, cliOpts.HasGpuSupport)
	cliOpts.CreateNamespace = eitherB(builtOpts.CreateNamespace, cliOpts.CreateNamespace)

	// careful: `--set x=3 --set x=4` results in x having
	// value 4, so we need to place the built
	// options first in the list
	cliOpts.OverrideValues = append(builtOpts.OverrideValues, cliOpts.OverrideValues...)
	cliOpts.OverrideFileValues = append(builtOpts.OverrideFileValues, cliOpts.OverrideFileValues...)

	return cliOpts
}

func (opts Options) Verbose() bool {
	return opts.Log.Verbose
}
