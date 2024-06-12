package hlir

type RepoSecretSpec struct {
	Repo string
	User string
	Pat  string
}

type RepoSecret struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       RepoSecretSpec
}
