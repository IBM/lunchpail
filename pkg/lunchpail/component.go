package lunchpail

import "fmt"

type Component string

const (
	WorkersComponent     Component = "workerpool"
	DispatcherComponent            = "workdispatcher"
	WorkStealerComponent           = "workstealer"
	MinioComponent                 = "minio"
)

func ComponentShortName(c Component) string {
	switch c {
	case WorkersComponent:
		return "Workers"
	case DispatcherComponent:
		return "Dispatch"
	case WorkStealerComponent:
		return "Runtime"
	default:
		return string(c)
	}
}

func lookup(maybe string) (Component, error) {
	switch maybe {
	case string(WorkersComponent):
		return WorkersComponent, nil
	case string(DispatcherComponent):
		return DispatcherComponent, nil
	case string(WorkStealerComponent):
		return WorkStealerComponent, nil
	case string(MinioComponent):
		return MinioComponent, nil
	}

	return "", fmt.Errorf("Unsupported component %s\n", maybe)
}

// String is used both by fmt.Print and by Cobra in help text
func (c *Component) String() string {
	return string(*c)
}

// Set must have pointer receiver so it doesn't change the value of a copy
func (c *Component) Set(v string) error {
	cc, err := lookup(v)
	if err != nil {
		return err
	}
	*c = cc
	return nil
}

// Type is only used in help text
func (c *Component) Type() string {
	return "Component"
}
