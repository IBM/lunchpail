package builder

import (
	"context"
	"embed"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"runtime"

	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/util"
)

//go:generate /bin/sh -c "while ! tar --exclude '*lunchpail-source.tar.gz' --exclude '*~' --exclude '*.git*' --exclude '*README.md' --exclude '*gitignore' --exclude '*DS_Store' --exclude '*lunchpail-source.tar.gz*' -C ../../.. -zcf lunchpail-source.tar.gz cmd pkg go.mod go.sum; do sleep 1; done"
//go:embed lunchpail-source.tar.gz
var lunchpailSource embed.FS

// Extract the lunchpail source into a temporary local filesystem
func stageLunchpailItself() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, lunchpailSource, "lunchpail-source.tar.gz"); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func Build(ctx context.Context, sourcePath string, opts Options) error {
	if f, err := os.Stat(opts.Name); err == nil && f.IsDir() {
		return fmt.Errorf("Output path already exists and is a directory: %s", opts.Name)
	}

	lunchpailStageDir, err := stageLunchpailItself()
	verbose := opts.BuildOptions.Log.Verbose
	if err != nil {
		return err
	} else if verbose {
		fmt.Fprintf(os.Stderr, "Stage directory: %s\n", lunchpailStageDir)
	}

	// TODO... how do we really want to get a good name for the app?
	buildName := build.Name()
	if sourcePath != "" {
		buildName = filepath.Base(trimExt(sourcePath))
	}
	if buildName == "pail" {
		buildName = filepath.Base(filepath.Dir(trimExt(sourcePath)))
		if buildName == "pail" {
			// probably a trailing slash
			buildName = filepath.Base(filepath.Dir(filepath.Dir(trimExt(sourcePath))))
		}
	}
	// replace _ with -
	buildName = regexp.MustCompile("_").ReplaceAllString(buildName, "-")

	if verbose {
		fmt.Fprintf(os.Stderr, "Using buildName=%s\n", buildName)
	}

	if appTemplatePath, appVersion, err := build.StagePath(buildName, sourcePath, build.StageOptions{Branch: opts.Branch, Verbose: verbose}); err != nil {
		return err
	} else if err := build.MoveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath, verbose); err != nil {
		return err
	} else if err := build.DropBreadcrumb(buildName, appVersion, opts.BuildOptions, lunchpailStageDir); err != nil {
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

		group, _ := errgroup.WithContext(ctx)
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
