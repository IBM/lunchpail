package hlir

type Rclone struct {
	RemoteName string `yaml:"remoteName"`
}

type CopyIn struct {
	Path  string
	Delay int `yaml:"delay,omitempty"`
}

type EnvFrom struct {
	Prefix string
}

type S3 struct {
	Rclone
	EnvFrom `yaml:"envFrom,omitempty"`
	CopyIn  `yaml:"copyIn,omitempty"`
}

type Blob struct {
	Content  string
	Encoding string
}

type Dataset struct {
	Name      string
	MountPath string `yaml:"mountPath,omitempty"`
	Blob
	S3  S3 `yaml:"s3,omitempty"`
	Nfs struct {
		Server string
		Path   string
	} `yaml:"nfs,omitempty"`
	Pvc struct {
		ClaimName string `yaml:"claimName"`
	} `yaml:"pvc,omitempty"`
}
