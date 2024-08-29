package be

import "fmt"

type Platform string

const (
	Kubernetes Platform = "kubernetes"
	IBMCloud            = "ibmcloud"
	SkyPilot            = "skypilot"
)

func lookup(maybe string) (Platform, error) {
	switch maybe {
	case string(Kubernetes):
		return Kubernetes, nil
	case string(IBMCloud):
		return IBMCloud, nil
	case string(SkyPilot):
		return SkyPilot, nil
	}

	return "", fmt.Errorf("Unsupported target platform %s\n", maybe)
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
