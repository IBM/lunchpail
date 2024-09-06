package ibmcloud

import (
	"lunchpail.io/pkg/lunchpail"
)

// Number of instances of the given component for the given run
func (backend Backend) InstanceCount(c lunchpail.Component, runname string) (int, error) {
	return 0, nil
}
