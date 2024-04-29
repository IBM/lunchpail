package lunchpail

import (
	_ "embed"
	"os"
	"path/filepath"
	"strings"
)

//go:embed appname.txt
var embededAppName string

func AssembledAppName() string {
	return strings.TrimSpace(embededAppName)
}

func IsAssembled() bool {
	return AssembledAppName() != "<none>"
}

func DropAppBreadcrumb(appname, stagedir string) error {
	return os.WriteFile(filepath.Join(stagedir, "pkg/lunchpail/appname.txt"), []byte(appname), 0644)
}
