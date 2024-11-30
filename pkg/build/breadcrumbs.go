package build

import (
	_ "embed"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"time"

	"gopkg.in/yaml.v2"

	"lunchpail.io/pkg/ir/hlir"
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

//go:embed testData.yaml
var testData []byte

func Name() string {
	n := os.Getenv("LUNCHPAIL_NAME")
	if n == "" {
		n = name
	}

	// avoid complications with downstream shell executions
	n = strings.TrimSpace(n)
	n = strings.Replace(n, "<", "", -1)
	n = strings.Replace(n, ">", "", -1)
	n = strings.Replace(n, "|", "", -1)
	n = strings.Replace(n, ";", "", -1)
	n = strings.Replace(n, "$", "", -1)
	n = strings.Replace(n, "{", "", -1)
	n = strings.Replace(n, "}", "", -1)

	return n
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

func HasTestData() bool {
	return len(testData) > 0
}

func TestData() (data hlir.TestData, err error) {
	if !HasTestData() {
		return
	}

	err = yaml.Unmarshal(testData, &data)
	return
}

func TestDataWithStage() (data hlir.TestData, stagePath string, err error) {
	data, err = TestData()
	if err != nil {
		return
	}

	stagePath, err = StageForBuilder(StageOptions{})
	return
}

func TestDataDirFor(templatePath string) string {
	return filepath.Join(templatePath, "test-data")
}

func TestDataDirForInput(templatePath string) string {
	return filepath.Join(TestDataDirFor(templatePath), "input")
}

func TestDataDirForExpected(templatePath string) string {
	return filepath.Join(TestDataDirFor(templatePath), "expected")
}

func IsBuilt() bool {
	return strings.TrimSpace(name) != "<none>"
}

func DropBreadcrumbs(buildName, appVersion string, testData hlir.TestData, opts Options, stagedir string) error {
	user, err := user.Current()
	if err != nil {
		return err
	}

	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if len(testData) > 0 {
		if b, err := yaml.Marshal(testData); err != nil {
			return err
		} else if err := os.WriteFile(filepath.Join(stagedir, "pkg/build/testData.yaml"), b, 0644); err != nil {
			return err
		}
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
