package names

import (
	"fmt"
	"strings"

	"lunchpail.io/pkg/ir/queue"
)

// This will be used to name the queue Secret and will be used as the
// envPrefix for secrets injected into the containers. Since dashes
// are not valid in bash variable names, so we avoid those here.
func Queue(run queue.RunContext) string {
	return fmt.Sprintf("%s%dqueue",
		strings.Replace(run.RunName, "-", "", -1),
		run.Step,
	)
}
