package util

import (
	"fmt"
	"time"
)

func RelTime(a, b time.Time) string {
	deltaMillis := b.Sub(a).Milliseconds()
	unit := ""
	div := 1
	switch {
	case deltaMillis < 1000:
		unit = "ms"
		div = 1
	case deltaMillis < 1000*60:
		unit = "s"
		div = 1000
	case deltaMillis < 1000*60*60:
		unit = "m"
		div = 1000 * 60
	default:
		unit = "h"
		div = 1000 * 60 * 60
	}
	return fmt.Sprintf("%.2f%s", float64(deltaMillis)/float64(div), unit)
}
