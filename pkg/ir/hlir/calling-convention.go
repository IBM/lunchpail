package hlir

import "fmt"

type CallingConvention string

const (
	CallingConventionFiles CallingConvention = "files"
	CallingConventionStdio                   = "stdio"
)

func lookup(maybe string) (CallingConvention, error) {
	switch maybe {
	case string(CallingConventionFiles):
		return CallingConventionFiles, nil
	case string(CallingConventionStdio):
		return CallingConventionStdio, nil
	}

	return "", fmt.Errorf("Unsupported calling convention %s\n", maybe)
}

// String is used both by fmt.Print and by Cobra in help text
func (cc *CallingConvention) String() string {
	return string(*cc)
}

// Set must have pointer receiver so it doesn't change the value of a copy
func (cc *CallingConvention) Set(v string) error {
	p, err := lookup(v)
	if err != nil {
		return err
	}
	*cc = p
	return nil
}

// Type is only used in help text
func (cc *CallingConvention) Type() string {
	return "CallingConvention"
}
