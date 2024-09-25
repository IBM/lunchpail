package info

import (
	"lunchpail.io/pkg/build"
)

type Info struct {
	Name                 string
	Date                 string
	By                   string
	On                   string
	ShrinkwrappedOptions build.Options
}

func Model() (Info, error) {
	shrinkwrappedOptions, err := build.RestoreOptions()
	if err != nil {
		return Info{}, err
	}

	return Info{build.Name(), build.Date(), build.By(), build.On(), shrinkwrappedOptions}, nil
}
