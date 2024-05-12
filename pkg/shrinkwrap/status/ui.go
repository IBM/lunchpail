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
			if !verbose {
				clearLine(os.Stderr)
			}
		}

		break
	}

	return appname, runname, nil
}

func max(nums ...int) int {
	max := 0
	for _, n := range nums {
		if n > max {
			max = n
		}
	}
	return max
}

func rspacex(str string, actualSpace, availableSpace int) string {
	// - 2 as availableSpace includes one space character on either side
	return str + strings.Repeat(" ", max(0, availableSpace - actualSpace - 2))
}

func rspace(str string, availableSpace int) string {
	return rspacex(str, len(str), availableSpace)
}

func rspacef(num, denom int, str string, availableSpace int) string {
	fullstr := fmt.Sprintf("%d/%d %s", num, denom, str)
	return rspace(fullstr, availableSpace)
}

func rspacef1(num int, status WorkerStatus, availableSpace int) string {
	frac := fmt.Sprintf("%d/1", num)
	fullstr := fmt.Sprintf("%s %s", frac, cell(status))
	return rspacex(fullstr, len(frac) + 2, availableSpace) // +1 for cell, +1 for space
}

func rspacefw(num int, denom int, workers []Worker, availableSpace int) string {
	frac := fmt.Sprintf("%d/%d", num, denom)
	fullstr := fmt.Sprintf("%s %s", frac, workerCells(workers))
	return rspacex(fullstr, len(frac) + 2, availableSpace)
}

func view(status Status) {
	dim := lipgloss.NewStyle().Faint(true)
	bold := lipgloss.NewStyle().Bold(true)
	cyan := lipgloss.NewStyle().Foreground(lipgloss.Color("6"))

	runningWorkers, totalWorkers := status.workersSplit()
	runningRuntime, _ := status.split(status.Runtime)
	runningInternalS3, _ := status.split(status.InternalS3)
	runningWorkStealer, _ := status.split(status.WorkStealer)

	// 2 = 1 for left pad, 1 for right pad
	// 4 = 1 for left pad, 1 for right pad, 1 for space between fraction and cells, 1 for fraction slash,
	nrightbars := max(
			8,
			2 + len(status.AppName),
			2 + len(status.RunName),
			4 + totalWorkers + len(strconv.Itoa(runningWorkers)) + len(strconv.Itoa(totalWorkers)),
		)
	rightbars := strings.Repeat(
		"─",
		nrightbars,
	)
	leftbars := "──────────────"
	topdiv := "┌" + leftbars + "┬" + rightbars + "┐"
	middiv := "│" + leftbars + "┼" + rightbars + "│"
	botdiv := "└" + leftbars + "┴" + rightbars + "┘"
	
	timestamp := status.LastEvent.Timestamp.Time
	if timestamp.IsZero() {
		timestamp = time.Now()
	}

	fmt.Printf(" %s\n", dim.Render(timestamp.Format(time.RFC850)))
	fmt.Println(topdiv)
	fmt.Printf("│ %-20s │ %s │\n", bold.Render("App"), cyan.Render(rspace(status.AppName, nrightbars)))
	fmt.Printf("│ %-20s │ %s │\n", bold.Render("Run"), cyan.Render(rspace(status.RunName, nrightbars)))
	fmt.Println(middiv)
	fmt.Printf("│ %-20s │ %s │\n",
		bold.Render("Queue"),
		rspacef1(runningInternalS3, status.InternalS3, nrightbars),
	)
	fmt.Printf("│ %-20s │ %s │\n",
		bold.Render("Runtime"),
		rspacef1(runningRuntime, status.Runtime, nrightbars),
	)
	fmt.Printf("│ %-20s │ %s │\n",
		bold.Render("WorkStealer"),
		rspacef1(runningWorkStealer, status.Runtime, nrightbars),
	)
	fmt.Println(middiv)
	fmt.Printf("│ %-20s │ %s │\n", bold.Render("Pools"), cyan.Render(rspace(strconv.Itoa(status.numPools()), nrightbars)))
	for poolIdx, pool := range status.Pools {
		fmt.Printf("│ %-20s │ %s │\n",
			bold.Render("Pool " + strconv.Itoa(poolIdx + 1)), // TODO pool.Name
			rspacefw(runningWorkers, totalWorkers, pool.Workers, nrightbars),
		)
	}
	fmt.Println(botdiv)

	if status.LastEvent.Message != "" {
		fmt.Println(dim.Render(status.LastEvent.Message))
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
	case Booting:
		style = yellow
	case Terminating:
		style = gray
	case Failed:
		style = red
	case Succeeded:
		style = cyan
	}

	cell := "■"
	return style.Render(cell)
}

func clearScreen(writer io.Writer) {
	fmt.Fprintf(writer, "\x1b[2J\x1b[H")
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

	clearScreen(os.Stdout)

	for status := range c {
		if !opts.Verbose {
			clearScreen(os.Stdout)
		}

		view(status)
	}

	return nil
}
