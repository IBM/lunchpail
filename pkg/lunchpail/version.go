package lunchpail

import (
	_ "embed"
	"strings"
)

//go:generate /bin/sh -c "grep appVersion ../../templates/core/Chart.yaml | tr -s ' ' | cut -d' ' -f2 > version.txt"
//go:embed version.txt
var version string

func Version() string {
	return strings.TrimSpace(version)
}

