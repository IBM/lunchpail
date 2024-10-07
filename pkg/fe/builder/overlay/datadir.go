package overlay

import (
	"fmt"
	"os"
	"path/filepath"
)

// Copy over application source from a `datadir` directory if it
// exists
func handleDataDir(templatePath string, dirname string, verbose bool) error {
	dir := filepath.Join(appdir(templatePath), dirname)
	if _, err := os.Stat(dir); err == nil {
		// then there is a 'dirname' directory that we need to
		// move out of the template/ directory (this is a helm
		// thing)
		templateDir := filepath.Join(templatePath, dirname)

		if err := os.MkdirAll(templateDir, 0755); err != nil {
			return err
		}

		entries, err := os.ReadDir(dir)
		if err != nil {
			return err
		}

		for _, entry := range entries {
			sourcePath := filepath.Join(dir, entry.Name())
			destPath := filepath.Join(templateDir, entry.Name())
			if verbose {
				fmt.Fprintf(os.Stderr, "Injecting application %s %s -> %s\n", dirname, sourcePath, destPath)
			}
			os.Rename(sourcePath, destPath)
		}

		if err := os.Remove(dir); err != nil {
			return err
		}
	}

	return nil
}
