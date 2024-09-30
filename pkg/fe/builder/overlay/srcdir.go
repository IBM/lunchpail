package overlay

import (
	"fmt"
	"os"
	"path/filepath"
)

// Copy over application source from a src/ directory if it exists
func handleSrcDir(templatePath string, verbose bool) error {
	appSrc := filepath.Join(appdir(templatePath), "src")
	if _, err := os.Stat(appSrc); err == nil {
		// then there is a src directory that we need to move
		// out of the template/ directory (this is a helm
		// thing)
		templateSrc := filepath.Join(templatePath, "src")
		os.MkdirAll(templateSrc, 0755)
		entries, err := os.ReadDir(appSrc)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			sourcePath := filepath.Join(appSrc, entry.Name())
			destPath := filepath.Join(templateSrc, entry.Name())
			if verbose {
				fmt.Fprintf(os.Stderr, "Injecting application source %s -> %s %v\n", sourcePath, destPath, entry)
			}
			os.Rename(sourcePath, destPath)
		}
		if err := os.Remove(appSrc); err != nil {
			return err
		}
	}

	return nil
}
