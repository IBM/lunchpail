package assembly

import (
	_ "embed"
	"os"
	"path/filepath"
	"strings"
	"time"
)

//go:embed assemblyName.txt
var name string

//go:embed assemblyDate.txt
var date string

func Name() string {
	return strings.TrimSpace(name)
}

func Date() string {
	return strings.TrimSpace(date)
}

func IsAssembled() bool {
	return Name() != "<none>"
}

func DropBreadcrumb(assemblyName, stagedir string) error {
	if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assemblyName.txt"), []byte(assemblyName), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assemblyDate.txt"), []byte(time.Now().String()), 0644); err != nil {
		return err
	}

	return nil
}
