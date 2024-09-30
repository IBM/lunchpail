package overlay

import (
	"os"
	"path/filepath"
	"strings"
)

// Check if the app has a version file
func handleVersionFile(templatePath string, verbose bool) (string, error) {
	appVersion := ""
	appVersionFile := filepath.Join(appdir(templatePath), "version")
	if _, err := os.Stat(appVersionFile); err == nil {
		versionBytes, err := os.ReadFile(appVersionFile)
		if err != nil {
			return "", err
		}
		appVersion = strings.TrimSpace(string(versionBytes))

		if err := os.Remove(appVersionFile); err != nil {
			return "", err
		}
	}

	return appVersion, nil
}
