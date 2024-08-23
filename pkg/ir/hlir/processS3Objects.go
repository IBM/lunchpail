package hlir

type ProcessS3Objects struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Rclone
		Path   string
		Repeat int `yaml:",omitempty"`
		Env    Env `yaml:",omitempty"`
	}
}
