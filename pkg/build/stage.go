package build

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/util"
)

type StageOptions struct {
	Verbose bool
}

// return (templatePath, error)
func StageForBuilder(appname string, opts StageOptions) (string, error) {
	// TODO overlay on kube/common?
	templatePath, err := ioutil.TempDir("", "lunchpail")
	if err != nil {
		return "", err

	} else if err := util.Expand(templatePath, appTemplate, appTemplateFile); err != nil {
		return "", err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Finished staging application template to %s\n", templatePath)
	}

	return templatePath, nil
}

// return (templatePath, error)
func StageForRun(opts StageOptions) (string, error) {
	appname := Name()
	templatePath, err := StageForBuilder(appname, opts)

	// TODO we could parallelize these two, but the overhead is probably not worth it
	if err := emitPlaceholderChartYaml(templatePath); err != nil {
		return "", err
	}
	if err := emitPlaceholderHelmIgnore(templatePath); err != nil {
		return "", err
	}

	return templatePath, err
}

// This is just to make helmClient.Template happy.
func emitPlaceholderChartYaml(templatePath string) error {
	chartYaml := `
apiVersion: v1
name: lunchpail
type: application
version: 0.0.1
appVersion: 0.0.1`
	return os.WriteFile(filepath.Join(templatePath, "Chart.yaml"), []byte(chartYaml), 0644)
}

// This is just to make helmClient.Template happy.
func emitPlaceholderHelmIgnore(templatePath string) error {
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
