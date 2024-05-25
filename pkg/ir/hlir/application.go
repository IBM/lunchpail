package hlir

type Env map[string]string

type Code struct {
	Name   string
	Source string
}

type Application struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Api                      Api
		Role                     Role
		Code                     []Code                   `yaml:"code,omitempty"`
		Description              string                   `yaml:"description,omitempty"`
		SupportsGpu              bool                     `yaml:"supportsGpu,omitempty"`
		Expose                   []int                    `yaml:"expose,omitempty"`
		MinSize                  TShirtSize               `yaml:"minSize,omitempty"`
		Tags                     []string                 `yaml:"tags,omitempty"`
		Repo                     string                   `yaml:"repo,omitempty"`
		Command                  string                   `yaml:"command,omitempty"`
		Image                    string                   `yaml:"image,omitempty"`
		Env                      Env                      `yaml:"env,omitempty"`
		Datasets                 []Dataset                `yaml:"datasets,omitempty"`
		SecurityContext          SecurityContext          `yaml:"securityContext,omitempty"`
		ContainerSecurityContext ContainerSecurityContext `yaml:"containerSecurityContext,omitempty"`
	}
}
