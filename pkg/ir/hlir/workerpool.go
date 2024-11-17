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
	}
}

func NewPool(name string, count int) WorkerPool {
	p := WorkerPool{
		ApiVersion: "v1alpha1",
		Kind:       "WorkerPool",
		Metadata:   Metadata{Name: name},
	}

	p.Spec.Workers.Count = count

	return p
}
