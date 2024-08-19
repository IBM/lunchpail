package template

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/util"
)

// Extract embeded template to local filesystem
func Stage() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail_application_stage_"); err != nil {
		return "", err
	} else if err := util.Expand(dir, appTemplate, appTemplateFile); err != nil {
		return "", err
	} else {
		return dir, nil
	}
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

	cmd := exec.Command("tar", verboseFlag, "-zcf", tarball, "-C", appTemplatePath, ".")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
