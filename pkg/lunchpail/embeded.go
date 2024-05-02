package lunchpail

import (
	_ "embed"
	"os"
	"path/filepath"
	"strings"
	"time"
)

//go:embed appname.txt
var embededAppName string

//go:embed assemblyDate.txt
var embededAssemblyDate string

func AssembledAppName() string {
	return strings.TrimSpace(embededAppName)
}

func AssemblyDate() string {
	return strings.TrimSpace(embededAssemblyDate)
}

func IsAssembled() bool {
	return AssembledAppName() != "<none>"
}

func DropAppBreadcrumb(appname, stagedir string) error {
	if err := os.WriteFile(filepath.Join(stagedir, "pkg/lunchpail/appname.txt"), []byte(appname), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/lunchpail/assemblyDate.txt"), []byte(time.Now().String()), 0644); err != nil {
		return err
	}

	return nil
}
