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

type Spec struct {
	Role                     role                     `yaml:",omitempty"`
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
	IsDispatcher             bool                     `yaml:"isDispatcher,omitempty"`
	CallingConvention        `yaml:"callingConvention,omitempty"`
}

type Application struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata
	Spec
}

func newApplicationWithRole(name string, role role) Application {
	return Application{
		ApiVersion: "v1alpha1",
		Kind:       "Application",
		Metadata:   Metadata{name},
		Spec:       Spec{Role: role},
	}
}

func NewWorkerApplication(name string) Application {
	return newApplicationWithRole(name, workerRole)
}

func NewSupportApplication(name string) Application {
	return newApplicationWithRole(name, supportRole)
}
