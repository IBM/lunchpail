package llir

import (
	"lunchpail.io/pkg/fe/linker/queue"
)

type ApplicationInstanceSpec struct {
	RunAsJob        bool
	InstanceName    string
	QueuePrefixPath string
	ServiceAccount  string
	Sizing          RunSizeConfig
	Queue           queue.Spec
}
