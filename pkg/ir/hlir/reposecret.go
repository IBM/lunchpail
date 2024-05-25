package hlir

type RepoSecret struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Repo   string
		Secret struct {
			Name string
		}
	}
}
