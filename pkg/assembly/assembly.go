package assembly

import (
	_ "embed"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"time"
)

//go:embed assemblyName.txt
var name string

//go:embed assemblyDate.txt
var date string

//go:embed assembledBy.txt
var by string

//go:embed assembledOn.txt
var on string

//go:embed appVersion.txt
var appVersion string

func Name() string {
	return strings.TrimSpace(name)
}

func Date() string {
	return strings.TrimSpace(date)
}

func By() string {
	return strings.TrimSpace(by)
}

func On() string {
	return strings.TrimSpace(on)
}

func AppVersion() string {
	return strings.TrimSpace(appVersion)
}

func IsAssembled() bool {
	return Name() != "<none>"
}

func DropBreadcrumb(assemblyName, appVersion, stagedir string) error {
	user, err := user.Current()
	if err != nil {
		return err
	}

	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assemblyName.txt"), []byte(assemblyName), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/appVersion.txt"), []byte(appVersion), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assemblyDate.txt"), []byte(time.Now().String()), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assembledBy.txt"), []byte(fmt.Sprintf("%s <%s>", user.Name, user.Username)), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/assembly/assembledOn.txt"), []byte(hostname), 0644); err != nil {
		return err
	}

	return nil
}
