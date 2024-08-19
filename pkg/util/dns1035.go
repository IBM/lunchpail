package util

import (
	"regexp"
	"strings"
)

func Dns1035(name string) string {
	if len(name) > 53 {
		name = name[len(name)-53:]
		if strings.HasSuffix(name, "-") {
			name = name[:len(name)-1]
		}

		r := regexp.MustCompile(`^[\d-.]+`)
		name = r.ReplaceAllString(name, "")
	}

	return name
}
