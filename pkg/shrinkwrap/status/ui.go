package status

import (
	"fmt"
	"github.com/charmbracelet/lipgloss"
	"io"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/runs"
	"os"
	"strconv"
	"strings"
	"time"
)

type Options struct {
	Namespace string
	Watch     bool
	Verbose   bool
}

func WaitForRun(runname, namespace string, wait bool, verbose bool) (string, string, error) {
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
			fmt.Fprintf(os.Stderr, "\n")
			if !verbose {
				clearLine(os.Stderr)
			}
		}

		break
	}

	return appname, runname, nil
}

func view(status Status) []string {
	dim := lipgloss.NewStyle().Faint(true)
	bold := lipgloss.NewStyle().Bold(true)
	cyan := lipgloss.NewStyle().Foreground(lipgloss.Color("6"))

	runningWorkers, totalWorkers := status.workersSplit()
	runningRuntime, totalRuntime := status.split(status.Runtime)
	runningInternalS3, totalInternalS3 := status.split(status.InternalS3)

	timestamp := status.LastEvent.Timestamp.Time
	if timestamp.IsZero() {
		timestamp = time.Now()
	}

	return []string{
		dim.Render(timestamp.Format(time.RFC850)),
		fmt.Sprintf("%-16s ▏%s", bold.Render("App"), cyan.Render(status.AppName)),
		fmt.Sprintf("%-16s ▏%s", bold.Render("Run"), cyan.Render(status.RunName)),
		fmt.Sprintf("%-16s ▏%s", bold.Render("Pools"), cyan.Render(strconv.Itoa(status.numPools()))),

		fmt.Sprintf("%-16s ▏%d/%d %s",
			bold.Render("Workers"),
			runningWorkers, totalWorkers,
			workerCells(status.workers()),
		),

		fmt.Sprintf("%-16s ▏%d/%d %s",
			bold.Render("Queue"),
			runningInternalS3, totalInternalS3,
			cell(status.Runtime),
		),

		fmt.Sprintf("%-16s ▏%d/%d %s",
			bold.Render("Runtime"),
			runningRuntime, totalRuntime,
			cell(status.Runtime),
		),

		dim.Render(status.LastEvent.Message),
	}
}

func workerCells(workers []Worker) string {
	res := ""
	for _, worker := range workers {
		res += cell(worker.Status)
	}
	return res
}

func cell(status WorkerStatus) string {
	yellow := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#ffd92f"})
	green := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
	red := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#fc8d62"})
	gray := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#b3b3b3"})
	cyan := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#66c2a5"})

	style := green
	switch status {
	case Pending:
		style = yellow
	case Terminating:
		style = gray
	case Failed:
		style = red
	case Succeeded:
		style = cyan
	}

	cell := "■"
	// cell := "◼"
	// cell := "▇▇"
	return style.Render(cell)
}

func clearLine(writer io.Writer) {
	fmt.Fprintf(writer, "\033[1A\033[K")
}

func UI(runnameIn string, opts Options) error {
	appname, runname, err := WaitForRun(runnameIn, opts.Namespace, opts.Watch, opts.Verbose)
	if err != nil {
		return err
	}

	c, err := StreamStatus(appname, runname, opts.Namespace)
	if err != nil {
		return err
	}
	defer close(c)

	var val []string
	for status := range c {
		if !opts.Verbose && opts.Watch && len(val) > 0 {
			for range len(val) {
				clearLine(os.Stdout)
			}
		}

		val = view(status)
		for _, line := range val {
			fmt.Println(line)
		}
	}

	return nil
}
