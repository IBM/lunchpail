package queue

import (
	"path/filepath"
	"strings"
)

// i.e. "/run/{{.RunName}}/step/{{.Step}}"
func (run RunContext) ListenPrefix() string {
	A := strings.Split(run.AsFile(Unassigned), "/")
	return filepath.Join(A[0:5]...)
}
