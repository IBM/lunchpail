package assembler

import (
	"embed"
	"fmt"
	"io/ioutil"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap"
	"os"
	"os/exec"
	"path/filepath"
)

//go:generate /bin/sh -c "tar --exclude '*~' --exclude '*README.md' --exclude '*gitignore' --exclude '*DS_Store' --exclude '*lunchpail-source.tar.gz*' -C ../.. -zcf lunchpail-source.tar.gz cmd pkg go.mod go.sum"
//go:embed lunchpail-source.tar.gz
var lunchpailSource embed.FS

func stageLunchpail() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := shrinkwrap.Expand(dir, lunchpailSource, "lunchpail-source.tar.gz", false); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func moveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath string) error {
	cmd := exec.Command("tar", "zcf", filepath.Join(lunchpailStageDir, "pkg", "shrinkwrap", "charts.tar.gz"), "-C", appTemplatePath, ".")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func Assemble(sourcePath string, opts Options) error {
	if f, err := os.Stat(opts.Name); err == nil && f.IsDir() {
		return fmt.Errorf("Output path already exists and is a directory: %s", opts.Name)
		// } else if err == nil {
		// return fmt.Errorf("Output path already exists: %s", opts.Name)
	}

	lunchpailStageDir, err := stageLunchpail()
	if err != nil {
		return err
	} else if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory: %s\n", lunchpailStageDir)
	}

	// TODO... how do we really want to get a good name for the app?
	appname := filepath.Base(trimExt(sourcePath))
	if appname == "pail" {
		appname = filepath.Base(filepath.Dir(trimExt(sourcePath)))
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using appname=%s\n", appname)
	}

	if appTemplatePath, err := shrinkwrap.Stage(appname, sourcePath, shrinkwrap.StageOptions{opts.Branch, opts.Verbose}); err != nil {
		return err
	} else if err := lunchpail.SaveAppOptions(appTemplatePath, opts.AppOptions); err != nil {
		return err
	} else if err := moveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath); err != nil {
		return err
	} else if err := lunchpail.DropAppBreadcrumb(appname, lunchpailStageDir); err != nil {
		return err
	} else {
		return compile(lunchpailStageDir, opts.Name)
	}
}
