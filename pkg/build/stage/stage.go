package stage

import (
	"fmt"
	"os"
)

func CopyAppIntoTemplate(appname, sourcePath, templatePath, branch string, verbose bool) (string, error) {
	if verbose {
		fmt.Fprintf(os.Stderr, "Copying app templates into %s\n", appdir(templatePath))
	}
	os.MkdirAll(appdir(templatePath), 0755)

	if err := getSource(sourcePath, templatePath, branch, verbose); err != nil {
		return "", err
	}

	appVersion, err := handleVersionFile(templatePath, verbose)
	if err != nil {
		return "", err
	}
	if err := handleHelmIgnore(templatePath, verbose); err != nil {
		return "", err
	}
	if err := handleSrcDir(templatePath, verbose); err != nil {
		return "", err
	}
	if err := handleValuesYaml(templatePath, verbose); err != nil {
		return "", err
	}

	return appVersion, nil
}
