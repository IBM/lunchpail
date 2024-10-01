package overlay

import (
	"fmt"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/util"
)

// If the app has a .helmignore file, append it to the one in the template
func handleHelmIgnore(templatePath string, verbose bool) error {
	appHelmignore := filepath.Join(appdir(templatePath), ".helmignore")
	if f, err := os.Stat(appHelmignore); err == nil {
		if f.IsDir() {
			return fmt.Errorf(".helmignore should be a file, not a directory")
		}

		fmt.Fprintf(os.Stderr, "Including application helmignore\n")
		templateHelmignore := filepath.Join(templatePath, ".helmignore")
		if err := util.AppendFile(templateHelmignore, appHelmignore); err != nil {
			return err
		}
	}

	return nil
}
