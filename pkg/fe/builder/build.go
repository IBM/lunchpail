package builder

import (
	"context"
	"embed"
	"fmt"
	"io/ioutil"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/builder/overlay"
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
	if sourcePath != "" && opts.OverlayOptions.Command != "" {
		return fmt.Errorf("Both a source path and --command options were provided. Choose one or the other.")
	}

	if f, err := os.Stat(opts.Name); err == nil && f.IsDir() {
		return fmt.Errorf("Output path already exists and is a directory: %s", opts.Name)
	}

	// First, copy out lunchpail itself
	lunchpailStageDir, err := stageLunchpailItself()
	if err != nil {
		return err
	} else if opts.Verbose() {
		fmt.Fprintf(os.Stderr, "Stage directory: %s\n", lunchpailStageDir)
	}

	// Second, pick a name for the resulting build. TODO: allow command line override?
	buildName := buildNameFrom(sourcePath)

	fmt.Fprintf(os.Stderr, "Building %s\n", buildName)

	// Third, overlay source (if given)
	appTemplatePath, appVersion, err := overlay.OverlaySourceOntoPriorBuild(buildName, sourcePath, opts.OverlayOptions)
	if err != nil {
		return err
	}

	// Fourth, copy that overlay into the lunchpail stage (TODO:
	// why do we need two stages? cannot overlay.Overlay... copy
	// directly into the lunchpail stage??)
	if err := build.MoveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath, opts.Verbose()); err != nil {
		return err
	}

	// Fifth, tell the build about itself (its name, version)
	if err := build.DropBreadcrumbs(buildName, appVersion, opts.OverlayOptions.BuildOptions, lunchpailStageDir); err != nil {
		return err
	}

	// Finally, emit a new binary
	if opts.AllPlatforms {
		return emitAll(ctx, lunchpailStageDir, opts.Name)
	}
	return emit(lunchpailStageDir, opts.Name, "", "")
}
