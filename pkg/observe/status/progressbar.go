package status

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/charmbracelet/bubbles/progress"
	"lunchpail.io/pkg/util"
)

// map from task being processed to percent completion
type Progress struct {
	numbars int
	bars    *sync.Map // map from task name (string) to percent completion (float64)
}

func (msg *Message) isProgressBar() bool {
	return strings.HasPrefix(msg.message, "ProgressBar")
}

func (model *Model) updateProgress(msg Message) bool {
	if msg.isProgressBar() {
		fields := strings.Fields(msg.message)
		if len(fields) == 3 {
			task := fields[1]
			percentStr := fields[2]
			numerator := float64(1)
			if percentStr[len(percentStr)-1] == '%' {
				percentStr = percentStr[:len(percentStr)-1]
				numerator = 100
			}

			if percent, err := strconv.ParseFloat(percentStr, 64); err == nil {
				if _, exists := model.Progress.bars.Load(task); !exists {
					model.Progress.numbars++
				}
				model.Progress.bars.Store(task, percent/numerator)
				return true
			}
		}
	}

	return false
}

type progressbarForSorting struct {
	task    string
	percent float64
}

func viewProgress(model Model, maxwidth int) []string {
	lines := []string{}

	if model.Progress.numbars > 0 {
		bars := []progressbarForSorting{}
		maxTaskLen := 0
		model.Progress.bars.Range(func(atask any, apercent any) bool {
			if task, ok := atask.(string); ok {
				if percent, ok := apercent.(float64); ok && percent >= 0 && percent < 1 {
					// note with percent < 1 we
					// skip displaying completed
					// tasks in the progressbar UI
					maxTaskLen = max(maxTaskLen, len(task))
					bars = append(bars, progressbarForSorting{task, percent})
				}
			}
			return true
		})

		sort.Slice(bars, func(i, j int) bool { return strings.Compare(bars[i].task, bars[j].task) < 0 })

		maxTaskLen = min(maxTaskLen, 20)
		for _, p := range bars {
			bar := progress.New(progress.WithSolidFill("#e5c494"))
			bar.Width = maxwidth - maxTaskLen - 1 // 1 for the space between task and bar
			lines = append(
				lines,
				fmt.Sprintf("%*s %s", maxTaskLen, util.ElideEnd(p.task, maxTaskLen), bar.ViewAs(p.percent)),
			)
		}
	}

	return lines
}
