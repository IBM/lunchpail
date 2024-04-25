package shrinkwrap

import "embed"

// Untar the given `file` located in the given `fs` into `destPath`
func Expand(destPath string, fs embed.FS, file string, nostrip bool) error {
	reader, err := fs.Open(file)
	if err != nil {
		return err
	}
	defer reader.Close()
	if err := Untar(destPath, reader, nostrip); err != nil {
		return err
	} else {
		return nil
	}
}
