package build

import (
	_ "embed"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"time"
)

//go:embed buildName.txt
var name string

//go:embed buildDate.txt
var date string

//go:embed builtBy.txt
var by string

//go:embed builtOn.txt
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

func IsBuilt() bool {
	return Name() != "<none>"
}

func DropBreadcrumb(buildName, appVersion string, opts Options, stagedir string) error {
	user, err := user.Current()
	if err != nil {
		return err
	}

	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/buildName.txt"), []byte(buildName), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/appVersion.txt"), []byte(appVersion), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/buildDate.txt"), []byte(time.Now().String()), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/builtBy.txt"), []byte(fmt.Sprintf("%s <%s>", user.Name, user.Username)), 0644); err != nil {
		return err
	} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/builtOn.txt"), []byte(hostname), 0644); err != nil {
		return err
	} else if err := saveOptions(stagedir, opts); err != nil {
		return err
	}

	return nil
}