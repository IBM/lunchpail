package hlir

type SecurityContext struct {
	RunAsUser  int `yaml:"runAsUser,omitempty"`
	RunAsGroup int `yaml:"runAsGroup,omitempty"`
	FsGroup    int `yaml:"fsGroup,omitempty"`
}

type ContainerSecurityContext struct {
	RunAsUser      int `yaml:"runAsUser,omitempty"`
	RunAsGroup     int `yaml:"runAsGroup,omitempty"`
	SeLinuxOptions struct {
		Type  string `yaml:"type,omitempty"`
		Level string `yaml:"level,omitempty"`
	} `yaml:"seLinuxOptions,omitempty"`
}
