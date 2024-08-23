package info

import (
	"lunchpail.io/pkg/compilation"
)

type Info struct {
	Name                 string
	Date                 string
	By                   string
	On                   string
	ShrinkwrappedOptions compilation.Options
}

func Model() (Info, error) {
	_, templatePath, _, err := compilation.Stage(compilation.StageOptions{})
	if err != nil {
		return Info{}, err
	}

	shrinkwrappedOptions, err := compilation.RestoreOptions(templatePath)
	if err != nil {
		return Info{}, err
	}

	return Info{compilation.Name(), compilation.Date(), compilation.By(), compilation.On(), shrinkwrappedOptions}, nil
}
