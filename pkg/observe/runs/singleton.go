package runs

import (
	"fmt"
	"github.com/charmbracelet/lipgloss"
	"github.com/dustin/go-humanize"
	"strings"
	"time"
)

// Return a Run if there is one in the given namespace for the given
// app, otherwise error
func Singleton(appName, namespace string) (Run, error) {
	runs, err := List(appName, namespace)
	if err != nil {
		return Run{}, err
	}
	if len(runs) == 1 {
		return runs[0], nil
	} else if len(runs) > 1 {
		names := []string{}
		now := time.Now()
		dim := lipgloss.NewStyle().Faint(true)
		for _, run := range runs {
			names = append(names, fmt.Sprintf("%s %s", run.Name, dim.Render(humanize.RelTime(run.CreationTimestamp, now, "ago", "from now"))))
		}
		return Run{}, fmt.Errorf("More than one run found in namespace %s:\n%s", namespace, strings.Join(names, "\n"))
	} else {
		return Run{}, fmt.Errorf("No runs found in namespace %s", namespace)
	}
}
