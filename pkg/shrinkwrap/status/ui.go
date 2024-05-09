package status

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
	"github.com/charmbracelet/lipgloss"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/runs"
	v1 "k8s.io/api/core/v1"
)

type Options struct {
	Namespace string
	Watch bool
}

func WaitForRun(runname, namespace string, wait bool) (string, string, error) {
	appname := lunchpail.AssembledAppName()
	if namespace == "" {
		namespace = appname
	}

	waiting := true
	alreadySaidWeAreWaiting := false

	for waiting {
		if runname == "" {
			if singletonRun, err := runs.Singleton(appname, namespace); err != nil {
				if wait && strings.Contains(err.Error(), "No runs") {
					if !alreadySaidWeAreWaiting {
						fmt.Fprintf(os.Stderr, "Waiting for runs...")
						alreadySaidWeAreWaiting = true
					}
					time.Sleep(2 * time.Second)
					continue
				} else {
					return "", "", err
				}
			} else {
				runname = singletonRun.Name
			}
		}

		if alreadySaidWeAreWaiting {
			clearLine()
		}

		break
	}

	return appname, runname, nil
}

func present(status Status) []string {
	dim := lipgloss.NewStyle().Faint(true)
	bold := lipgloss.NewStyle().Bold(true)
	cyan := lipgloss.NewStyle().Foreground(lipgloss.Color("6"))

	return []string{
		fmt.Sprintf("%s %s\t\t\t%s",
			bold.Render("App"),
			cyan.Render(status.AppName),
			dim.Render(time.Now().Format(time.RFC850)),
		),
	
		fmt.Sprintf("%s %s",
			bold.Render("Run"),
			cyan.Render(status.RunName),
		),
	
		fmt.Sprintf("%s %s",
			bold.Render("Pools"),
			cyan.Render(strconv.Itoa(status.numPools())),
		),

		fmt.Sprintf("%s %s",
			bold.Render("Workers"),
			workerCells(status),
		),
	}
}

func workerCells(status Status) string {
	cyan := lipgloss.NewStyle().Foreground(lipgloss.Color("6"))
	res := cyan.Render(strconv.Itoa(status.numWorkers())) + " "
	for _, worker := range status.workers() {
		res += workerCell(worker)
	}
	return res
}

func workerCell(worker Worker) string {
	// dim := lipgloss.NewStyle().Faint(true)
	yellow := lipgloss.NewStyle().Foreground(lipgloss.Color("3"))
	blue := lipgloss.NewStyle().Foreground(lipgloss.Color("4"))
	red := lipgloss.NewStyle().Foreground(lipgloss.Color("1"))
	// gray := dim
	cyan := lipgloss.NewStyle().Foreground(lipgloss.Color("6"))

	style := blue
	switch worker.Status {
	case v1.PodPending:
		style = yellow
		//	case v1.PodPhase.Terminating:
		//		style = gray
	case v1.PodFailed:
		style = red
	case v1.PodSucceeded:
		style = cyan
	}

	cell := "█"
	return style.Render(cell)
}

func clearLine() {
	fmt.Printf("\033[1A\033[K")
}

func UI(runnameIn string, opts Options) error {
	appname, runname, err := WaitForRun(runnameIn, opts.Namespace, opts.Watch)
	if err != nil {
		return err
	}

	c, err := Stream(appname, runname, opts.Namespace)
	if err != nil {
		return err
	}
	defer close(c)

	var val []string
	for status := range c {
		if opts.Watch && len(val) > 0 {
			for range len(val) {
				clearLine()
			}
		}

		val = present(status)
		for _, line := range val {
			fmt.Println(line)
		}
	}

	return nil
}
