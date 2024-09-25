//go:build full || build

package options

import (
	"lunchpail.io/pkg/build"
)

func RestoreBuildOptions() (build.Options, error) {
	if build.IsBuilt() {
		if o, err := build.RestoreOptions(); err != nil {
			return build.Options{}, err
		} else {
			return o, nil
		}
	}
	return build.Options{}, nil
}
