package util

import (
	"fmt"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs"
)

// Return a Run if there is one in the given namespace for the given
// app, otherwise error
func Singleton(backend be.Backend) (runs.Run, error) {
	list, err := backend.ListRuns(false)
	if err != nil {
		return runs.Run{}, err
	}
	if len(list) == 1 {
		return list[0], nil
	} else if len(list) > 1 {
		return runs.Run{}, fmt.Errorf("More than one run found:\n%s", runs.Pretty(list))
	} else {
		return runs.Run{}, fmt.Errorf("No runs found")
	}
}
