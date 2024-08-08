package info

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/compiler"
)

type Info struct {
	Name                 string
	Date                 string
	By                   string
	On                   string
	ShrinkwrappedOptions compilation.Options
}

func Model() (Info, error) {
	templatePath, err := compiler.StageTemplate()
	if err != nil {
		return Info{}, err
	}

	shrinkwrappedOptions, err := compilation.RestoreOptions(templatePath)
	if err != nil {
		return Info{}, err
	}

	return Info{compilation.Name(), compilation.Date(), compilation.By(), compilation.On(), shrinkwrappedOptions}, nil
}
