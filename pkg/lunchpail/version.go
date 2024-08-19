package lunchpail

import (
	_ "embed"
	"strings"
)

//go:generate /bin/sh -c "[ -d ../fe/template/chart ] && grep appVersion ../fe/template/chart/Chart.yaml | tr -s ' ' | cut -d' ' -f2 > version.txt || exit 0"
//go:embed version.txt
var version string

func Version() string {
	return strings.TrimSpace(version)
}
