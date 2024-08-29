package local

import (
	"os"
	"strings"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/lunchpail"
)

// Number of instances of the given component for the given run
func (backend Backend) InstanceCount(c lunchpail.Component, runname string) (int, error) {
	dir, err := files.PidfileDir(runname)
	if err != nil {
		return 0, err
	}

	fs, err := os.ReadDir(dir)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, file := range fs {
		if strings.Contains(file.Name(), string(c)) {
			count++
		}
	}

	return count, nil
}
