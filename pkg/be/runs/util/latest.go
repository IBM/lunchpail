package util

import (
	"context"
	"errors"
	"sort"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs"
)

var NoRunsFoundError = errors.New("No runs found")

// Return a Run if there is one in the given namespace for the given
// app, otherwise error
func LatestP(ctx context.Context, backend be.Backend, includeDone bool) (runs.Run, error) {
	list, err := backend.ListRuns(ctx, includeDone)
	switch {
	case err != nil:
		return runs.Run{}, err
	case len(list) == 0:
		return runs.Run{}, NoRunsFoundError
	}

	// sort to place most recent first
	sort.Slice(list, func(i, j int) bool {
		return list[i].CreationTimestamp.After(list[j].CreationTimestamp)
	})

	return list[0], nil
}

func Latest(ctx context.Context, backend be.Backend) (runs.Run, error) {
	return LatestP(ctx, backend, false)
}
