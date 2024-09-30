package overlay

import (
	"io"
	"os"
	"path/filepath"
)

// Join app-provided values.yaml with our common one
func handleValuesYaml(templatePath string, verbose bool) error {
	appValues := filepath.Join(appdir(templatePath), "values.yaml")
	if _, err := os.Stat(appValues); err == nil {
		// then there is a values.yaml that we need to
		// consolidate
		if reader, err := os.Open(appValues); err != nil {
			return err
		} else {
			defer reader.Close()
			templateValues := filepath.Join(templatePath, "values.yaml")
			if writer, err := os.OpenFile(templateValues, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err != nil {
				return err
			} else {
				defer writer.Close()
				io.Copy(writer, reader)
				os.Remove(appValues) // otherwise fe/parser/parse will think this is an invalid resource yaml
			}
		}
	}

	return nil
}
