package info

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/assembler"
)

type Info struct {
	Name                 string
	Date                 string
	By                   string
	On                   string
	ShrinkwrappedOptions assembly.Options
}

func Model() (Info, error) {
	templatePath, err := assembler.StageTemplate()
	if err != nil {
		return Info{}, err
	}

	shrinkwrappedOptions, err := assembly.RestoreOptions(templatePath)
	if err != nil {
		return Info{}, err
	}

	return Info{assembly.Name(), assembly.Date(), assembly.By(), assembly.On(), shrinkwrappedOptions}, nil
}
