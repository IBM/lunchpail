package overlay

import "path/filepath"

func appdir(templatePath string) string {
	return filepath.Join(templatePath, "templates/__embededapp__")
}
