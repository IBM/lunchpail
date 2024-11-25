package overlay

import (
	"fmt"
	"os"
	"strings"
)

// Check if the app has a version file
func handleVersionFile(appVersionFile string) (string, error) {
	appVersion := ""
	if f, err := os.Stat(appVersionFile); err == nil {
		if f.IsDir() {
			return "", fmt.Errorf("version should be a file, not a directory")
		}

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
