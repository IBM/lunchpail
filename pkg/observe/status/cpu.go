package status

import (
	"lunchpail.io/pkg/be/events/utilization"
)

func (model *Model) streamCpuUpdates(cpuc chan utilization.Model, c chan Model) error {
	for cpum := range cpuc {
		model.Cpu = cpum
		c <- *model
	}

	return nil
}
