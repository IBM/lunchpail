package queue

import (
	"path/filepath"
	"strings"
)

// i.e. "/run/{{.RunName}}/step/{{.Step}}"
func (run RunContext) ListenPrefix() string {
	return run.ListenPrefixForAnyStep(false)
}

// i.e. "/run/{{.RunName}}/step"
func (run RunContext) ListenPrefixForAnyStep(anyStep bool) string {
	A := strings.Split(run.AsFile(Unassigned), "/")

	if anyStep {
		return filepath.Join(A[0:4]...)
	}
	return filepath.Join(A[0:5]...)
}
