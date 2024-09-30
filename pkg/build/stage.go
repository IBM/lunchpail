package build

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/build/stage"
	"lunchpail.io/pkg/util"
)

type StageOptions struct {
	Branch  string
	Verbose bool
}

// return (templatePath, appVersion, error)
func StagePath(appname, sourcePath string, opts StageOptions) (string, string, error) {
	appVersion := AppVersion()

	// TODO overlay on kube/common?
	templatePath, err := ioutil.TempDir("", "lunchpail")
	if err != nil {
		return "", "", err

	} else if err := util.Expand(templatePath, appTemplate, appTemplateFile); err != nil {
		return "", "", err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Application source stage dir=%s\n", templatePath)
	}

	if sourcePath != "" {
		if version, err := stage.CopyAppIntoTemplate(appname, sourcePath, templatePath, opts.Branch, opts.Verbose); err != nil {
			return "", "", err
		} else {
			appVersion = version
		}
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Finished staging application to %s\n", templatePath)
	}

	return templatePath, appVersion, nil
}

// return (appname, templatePath, appVersion, error)
func Stage(opts StageOptions) (string, string, string, error) {
	appname := Name()
	templatePath, appVersion, err := StagePath(appname, "", opts)

	// TODO parallelize these two
	if err := dropChartYaml(templatePath); err != nil {
		return "", "", "", err
	}
	if err := dropHelmIgnore(templatePath); err != nil {
		return "", "", "", err
	}

	return appname, templatePath, appVersion, err
}

// This is just to make helmClient.Template happy.
func dropChartYaml(templatePath string) error {
	chartYaml := `
apiVersion: v1
name: lunchpail
type: application
version: 0.0.1
appVersion: 0.0.1`
	return os.WriteFile(filepath.Join(templatePath, "Chart.yaml"), []byte(chartYaml), 0644)
}

// This is just to make helmClient.Template happy.
func dropHelmIgnore(templatePath string) error {
	ignore := `
*.md
*~
.git
.gitignore
.helmignore
.DS_Store
.cache
LICENSE`
	return util.AppendToFile(filepath.Join(templatePath, ".helmignore"), []byte(ignore))
}

// Reverse of Stage(), store a staged local filesystem in the "right
// place" so that future calls to Stage() will pick up the changes
func MoveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath string, verbose bool) error {
	tarball := filepath.Join(lunchpailStageDir, embededTemplatePath)
	verboseFlag := ""
	if verbose {
		verboseFlag = "-v"
		fmt.Fprintf(os.Stderr, "Transferring staged app template to final stage %s -> %s\n", appTemplatePath, tarball)
	}

	cmd := exec.Command("tar", verboseFlag, "-zcf", tarball, "--exclude", "LICENSE", "--exclude", "*.git*", "-C", appTemplatePath, ".")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
