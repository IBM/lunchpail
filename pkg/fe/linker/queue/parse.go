package queue

import "fmt"

func ParseFlag(flag, runname string, internalS3Port int) (Spec, error) {
	isRclone, spec, err := parseFlagAsRclone(flag, runname, internalS3Port)

	if err != nil {
		return Spec{}, err
	} else if flag != "" && !isRclone {
		return Spec{}, fmt.Errorf("Unsupported scheme for queue: '%s'", flag)
	}

	return spec, nil
}
