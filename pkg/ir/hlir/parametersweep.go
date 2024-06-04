package hlir

type ParameterSweep struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Min      int
		Max      int
		Step     int `yaml:",omitempty"`
		Interval int `yaml:",omitempty"`
		Env      Env `yaml:",omitempty"`
	}
}
