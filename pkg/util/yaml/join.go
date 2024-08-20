package yaml

import "strings"

func Join(ys []string) string {
	return strings.Join(ys, "\n---\n")
}
