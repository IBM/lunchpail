package util

import (
	"regexp"
	"strings"
)

// See https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
// See https://datatracker.ietf.org/doc/html/rfc1035
func Dns1035(name string) string {
	// trim to have at most 53 characters
	if len(name) > 53 {
		name = name[len(name)-53:]
	}

	// trim off leading numbers, dashes, and dots
	r := regexp.MustCompile(`^[\d-.]+`)
	name = r.ReplaceAllString(name, "")

	// trim off trailing dashes
	return strings.Trim(name, "-")
}
