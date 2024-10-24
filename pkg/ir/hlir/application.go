package hlir

type Env map[string]string

type Code struct {
	Name   string
	Source string
}

type Needs struct {
	Name         string
	Version      string
	Requirements string
}

type Application struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Role                     Role
		Code                     []Code                   `yaml:"code,omitempty"`
		Description              string                   `yaml:"description,omitempty"`
		SupportsGpu              bool                     `yaml:"supportsGpu,omitempty"`
		Expose                   []string                 `yaml:"expose,omitempty"`
		MinSize                  TShirtSize               `yaml:"minSize,omitempty"`
		Tags                     []string                 `yaml:"tags,omitempty"`
		Command                  string                   `yaml:"command,omitempty"`
		Image                    string                   `yaml:"image,omitempty"`
		Env                      Env                      `yaml:"env,omitempty"`
		Datasets                 []Dataset                `yaml:"datasets,omitempty"`
		SecurityContext          SecurityContext          `yaml:"securityContext,omitempty"`
		ContainerSecurityContext ContainerSecurityContext `yaml:"containerSecurityContext,omitempty"`
		Needs                    []Needs                  `yaml:"needs,omitempty"`
		CallingConvention        `yaml:"callingConvention,omitempty"`
	}
}

func NewApplication(name string) Application {
	app := Application{}

	app.ApiVersion = "v1alpha1"
	app.Kind = "Application"
	app.Metadata = Metadata{name}

	return app
}
