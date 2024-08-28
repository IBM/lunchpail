package runs

import (
	"fmt"
	"strings"
	"time"

	"github.com/dustin/go-humanize"
)

func Pretty(runs []Run) string {
	names := []string{}
	now := time.Now()

	for _, run := range runs {
		names = append(names, fmt.Sprintf("%s %s", run.Name, humanize.RelTime(run.CreationTimestamp, now, "ago", "from now")))
	}

	return strings.Join(names, "\n")
}
