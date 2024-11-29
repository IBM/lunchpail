package overlay

import (
	"os"

	"lunchpail.io/pkg/build"
)

// This utility combines two pieces:
// 1) stage what was previously built to a local directory, via build.StageAppTemplate()
// 2) if given source, overlay it into the local staging directory
//
// Note: we may have been given no source artifacts, if the user has
// asked to re-build, only changing or adding --set values but not
// changing/adding source
func OverlaySourceOntoPriorBuild(appname, sourcePath string, opts Options) (templatePath string, appVersion string, err error) {
	appVersion = build.AppVersion()

	// 1) stage what was previously built to a local directory, via build.StageAppTemplate()
	if templatePath, err = build.StageForBuilder(appname, build.StageOptions{Verbose: opts.Verbose()}); err != nil {
		return
	}

	if err = os.MkdirAll(appdir(templatePath), 0755); err != nil {
		return
	}

	// 2) if given source, overlay it into the local staging directory
	switch {
	case opts.Command != "":
		// 21) if given source if -c/--command, overlay it into the local staging directory
		err = copyCommandIntoTemplate(templatePath, opts)

	case sourcePath != "" && opts.SourceIsYaml:
		// 2b) source via yaml/HLIR spec
		appVersion, err = copyYamlSpecIntoTemplate(appname, sourcePath, templatePath, opts)

	case sourcePath != "":
		// 2c) source in the directory, no HLIR yaml given
		appVersion, err = copyFilesystemIntoTemplate(appname, sourcePath, templatePath, opts)
	}

	return
}
