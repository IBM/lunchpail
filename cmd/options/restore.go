//go:build full || compile

package options

import (
	"lunchpail.io/pkg/compilation"
)

func RestoreCompilationOptions() (compilation.Options, error) {
	if compilation.IsCompiled() {
		if o, err := compilation.RestoreOptions(); err != nil {
			return compilation.Options{}, err
		} else {
			return o, nil
		}
	}
	return compilation.Options{}, nil
}
