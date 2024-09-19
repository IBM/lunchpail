package util

import (
	"regexp"
	"strings"
)

// Trim `name` to have at most `maxlen` characters
func TrimToMax(name string, maxlen int) string {
	if len(name) > maxlen {
		name = name[len(name)-maxlen:]
	}

	// trim off leading numbers, dashes, and dots
	r := regexp.MustCompile(`^[\d-.]+`)
	name = r.ReplaceAllString(name, "")

	// trim off trailing dashes
	return strings.Trim(name, "-")

}

// See https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
// See https://datatracker.ietf.org/doc/html/rfc1035
func Dns1035(name string) string {
	return TrimToMax(name, 53)
}
