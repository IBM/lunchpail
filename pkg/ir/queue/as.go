package queue

import (
	"bytes"
	"path/filepath"
	"text/template"
)

// Instantiate the given `path` template with the values of `run`
func (run RunContext) AsFileE(path Path) (string, error) {
	tmpl, err := template.New("tmp").Parse(string(path))
	if err != nil {
		return "", err
	}

	var b bytes.Buffer
	if err := tmpl.Execute(&b, run); err != nil {
		return "", err
	}

	// Clean will remove trailing slashes
	return filepath.Clean(b.String()), nil
}

// As with AsFileE() but returning "" in case of errors
func (run RunContext) AsFile(path Path) string {
	s, err := run.AsFileE(path)
	if err != nil {
		return ""
	}
	return anyPoolP.ReplaceAllString(
		anyWorkerP.ReplaceAllString(
			anyTaskP.ReplaceAllString(s, ""),
			""),
		"")
}

// As with AsFile(), but independent of any particular worker
func (ctx RunContext) AsFileForAnyWorker(path Path) string {
	return ctx.ForPool(any).ForWorker(any).ForTask(any).AsFile(path)
}
