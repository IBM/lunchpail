package assembler

import (
	"context"
	"embed"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/util"
)

//go:generate /bin/sh -c "while ! tar --exclude '*lunchpail-source.tar.gz' --exclude '*~' --exclude '*.git*' --exclude '*README.md' --exclude '*gitignore' --exclude '*DS_Store' --exclude '*lunchpail-source.tar.gz*' -C ../../.. -zcf lunchpail-source.tar.gz cmd pkg go.mod go.sum; do sleep 1; done"
//go:embed lunchpail-source.tar.gz
var lunchpailSource embed.FS

func stageLunchpail() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, lunchpailSource, "lunchpail-source.tar.gz"); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func moveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath string, verbose bool) error {
	tarball := filepath.Join(lunchpailStageDir, "pkg/fe/assembler", "charts.tar.gz")
	verboseFlag := ""
	if verbose {
		verboseFlag = "-v"
		fmt.Fprintf(os.Stderr, "Transferring staged app template to final stage %s\n", tarball)
	}

	cmd := exec.Command("tar", verboseFlag, "-zcf", tarball, "-C", appTemplatePath, ".")
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
	assemblyName := filepath.Base(trimExt(sourcePath))
	if assemblyName == "pail" {
		assemblyName = filepath.Base(filepath.Dir(trimExt(sourcePath)))
		if assemblyName == "pail" {
			// probably a trailing slash
			assemblyName = filepath.Base(filepath.Dir(filepath.Dir(trimExt(sourcePath))))
		}
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using assemblyName=%s\n", assemblyName)
	}

	if appTemplatePath, err := StagePath(assemblyName, sourcePath, StageOptions{opts.Branch, opts.Verbose}); err != nil {
		return err
	} else if err := assembly.SaveOptions(appTemplatePath, opts.AssemblyOptions); err != nil {
		return err
	} else if err := moveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath, opts.Verbose); err != nil {
		return err
	} else if err := assembly.DropBreadcrumb(assemblyName, lunchpailStageDir); err != nil {
		return err
	} else {
		if !opts.AllPlatforms {
			return emit(lunchpailStageDir, opts.Name, "", "")
		}

		oss := supportedOs()
		archs := supportedArch()
		if !opts.AllPlatforms {
			oss = []string{runtime.GOOS}
			archs = []string{runtime.GOARCH}
		}

		group, _ := errgroup.WithContext(context.Background())
		for _, targetOs := range oss {
			for _, targetArch := range archs {
				group.Go(func() error {
					return emit(lunchpailStageDir, opts.Name, targetOs, targetArch)
				})
			}
		}

		return group.Wait()
	}
}
