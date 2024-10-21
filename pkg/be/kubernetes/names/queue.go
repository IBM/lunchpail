package names

import "strings"

// This will be used to name the queue Secret and will be used as the
// envPrefix for secrets injected into the containers. Since dashes
// are not valid in bash variable names, so we avoid those here.
func Queue(runname string) string {
	return strings.Replace(runname, "-", "", -1) + "queue"
}
