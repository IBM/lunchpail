package status

import (
	"lunchpail.io/pkg/observe/cpu"
)

func (model *Model) streamCpuUpdates(cpuc chan cpu.Model, c chan Model) error {
	for cpum := range cpuc {
		model.Cpu = cpum
		c <- *model
	}

	return nil
}
