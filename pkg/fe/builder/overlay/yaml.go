package overlay

import (
	"fmt"
	"os"
	"path/filepath"
)

func copyYamlSpecIntoTemplate(appname, sourcePath, templatePath string, opts Options) (appVersion string, err error) {
	if opts.Verbose() {
		fmt.Fprintln(os.Stderr, "Copying application YAML into", appdir(templatePath))
	}

	if err = getSource(sourcePath, templatePath, opts.Branch, opts.Verbose()); err != nil {
		return
	}

	if appVersion, err = handleVersionFile(filepath.Join(appdir(templatePath), "version")); err != nil {
		return
	}

	if err = handleHelmIgnore(templatePath, opts.Verbose()); err != nil {
		return
	}

	if err = handleDataDir(templatePath, "src", opts.Verbose()); err != nil {
		return
	}

	if err = handleDataDir(templatePath, "data", opts.Verbose()); err != nil {
		return
	}

	if err = handleValuesYaml(templatePath, opts.Verbose()); err != nil {
		return
	}

	return
}
