package hlir

type WorkerPool struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		StartupDelay string `yaml:"startupDelay,omitempty"`
		Env          Env    `yaml:"env,omitempty"`
		Workers      struct {
			Count int
			Size  TShirtSize
		}
		Target struct {
			Kubernetes struct {
				Context string
			}
		}
	}
}
