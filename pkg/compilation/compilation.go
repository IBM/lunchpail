package compilation

import (
	_ "embed"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"time"
)

//go:embed compilationName.txt
var name string

//go:embed compilationDate.txt
var date string

//go:embed compiledBy.txt
var by string

//go:embed compiledOn.txt
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

func IsCompiled() bool {
	return Name() != "<none>"
}

func DropBreadcrumb(compilationName, appVersion, stagedir string) error {
	user, err := user.Current()
	if err != nil {
		return err
	}

	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if err := os.WriteFile(filepath.Join(stagedir, "pkg/compilation/compilationName.txt"), []byte(compilationName), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/compilation/appVersion.txt"), []byte(appVersion), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/compilation/compilationDate.txt"), []byte(time.Now().String()), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/compilation/compiledBy.txt"), []byte(fmt.Sprintf("%s <%s>", user.Name, user.Username)), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/compilation/compiledOn.txt"), []byte(hostname), 0644); err != nil {
		return err
	}

	return nil
}
