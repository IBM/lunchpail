package assembler

import (
	"path/filepath"
	"strings"
)

func trimExt(fileName string) string {
	return filepath.Join(
		filepath.Dir(fileName),
		strings.TrimSuffix(filepath.Base(fileName), filepath.Ext(fileName)),
	)
}
