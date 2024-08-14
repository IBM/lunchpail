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

		// Wait for each task to complete before proceeding to the next task
		Wait bool

		// Verbose output
		Verbose bool
	}
}
