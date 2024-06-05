package hlir

type S3 struct {
	Secret    string
	EnvPrefix string `yaml:"envPrefix,omitempty"`
	CopyIn    struct {
		Path string
	} `yaml:"copyIn,omitempty"`
}

type Dataset struct {
	Name      string
	MountPath string `yaml:"mountPath,omitempty"`
	S3        S3     `yaml:"s3,omitempty"`
	Nfs       struct {
		Server string
		Path   string
	} `yaml:"nfs,omitempty"`
	Pvc struct {
		ClaimName string `yaml:"claimName"`
	} `yaml:"pvc,omitempty"`
}
