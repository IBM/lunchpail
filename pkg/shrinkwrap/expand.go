package shrinkwrap

import "embed"

// Untar the given `file` located in the given `fs` into `destPath`
func expand(destPath string, fs embed.FS, file string) error {
	reader, err := fs.Open(file)
	if err != nil {
		return err
	}
	defer reader.Close()
	if err := Untar(destPath, reader); err != nil {
		return err
	} else {
		return nil
	}
}
