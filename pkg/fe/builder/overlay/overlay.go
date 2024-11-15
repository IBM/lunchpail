package overlay

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
)

type Options struct {
	BuildOptions build.Options
	Branch       string
	Command      string
	Verbose      bool
}

// This utility combines two pieces:
// 1) stage what was previously built to a local directory, via build.StageAppTemplate()
// 2) if given source, overlay the source into the local staging directory
func OverlaySourceOntoPriorBuild(appname, sourcePath string, opts Options) (templatePath string, appVersion string, err error) {
	templatePath, err = build.StageForBuilder(appname, build.StageOptions{Verbose: opts.Verbose})
	if err != nil {
		return
	}

	appVersion = build.AppVersion()

	// sourcePath may be "" if the user has asked to re-build,
	// only changing or adding --set values but not
	// changing/adding source
	if sourcePath != "" {
		appVersion, err = copyAppIntoTemplate(appname, sourcePath, templatePath, opts)
		if err != nil {
			return
		}
	}

	if opts.Command != "" {
		appVersion, err = copyCommandIntoTemplate(appname, opts.Command, templatePath, opts)
		if err != nil {
			return
		}
	}

	return
}

func copyAppIntoTemplate(appname, sourcePath, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Copying app templates into %s\n", appdir(templatePath))
	}

	err = os.MkdirAll(appdir(templatePath), 0755)
	if err != nil {
		return
	}

	err = getSource(sourcePath, templatePath, opts.Branch, opts.Verbose)
	if err != nil {
		return
	}

	appVersion, err = handleVersionFile(templatePath, opts.Verbose)
	if err != nil {
		return
	}

	err = handleHelmIgnore(templatePath, opts.Verbose)
	if err != nil {
		return
	}

	err = handleDataDir(templatePath, "src", opts.Verbose)
	if err != nil {
		return
	}

	err = handleDataDir(templatePath, "data", opts.Verbose)
	if err != nil {
		return
	}

	err = handleValuesYaml(templatePath, opts.Verbose)
	if err != nil {
		return
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Done copying app templates into %s\n", appdir(templatePath))
	}

	return
}
