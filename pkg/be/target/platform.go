package target

import (
	"fmt"
	"os"
)

type Platform string

const (
	Kubernetes Platform = "kubernetes"
	IBMCloud            = "ibmcloud"
	Local               = "local"
	SkyPilot            = "skypilot"
)

func lookup(maybe string) (Platform, error) {
	switch maybe {
	case string(Local):
		return Local, nil
	case string(Kubernetes):
		return Kubernetes, nil
	case string(IBMCloud):
		return IBMCloud, nil
	case string(SkyPilot):
		return SkyPilot, nil
	}

	return "", fmt.Errorf("Unsupported target platform %s\n", maybe)
}

func FromEnv() (Platform, error) {
	if os.Getenv("LUNCHPAIL_TARGET") != "" {
		t, err := lookup(os.Getenv("LUNCHPAIL_TARGET"))
		if err != nil {
			return "", err
		}
		return t, nil
	}

	return "", nil
}

// String is used both by fmt.Print and by Cobra in help text
func (platform *Platform) String() string {
	return string(*platform)
}

// Set must have pointer receiver so it doesn't change the value of a copy
func (platform *Platform) Set(v string) error {
	p, err := lookup(v)
	if err != nil {
		return err
	}
	*platform = p
	return nil
}

// Type is only used in help text
func (platform *Platform) Type() string {
	return "Platform"
}
