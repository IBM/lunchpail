package views

import (
	"fmt"

	"github.com/charmbracelet/lipgloss"
	"lunchpail.io/pkg/lunchpail"
)

var Dim = lipgloss.NewStyle().Faint(true)
var Bold = lipgloss.NewStyle().Bold(true)
var SelectedForeground = lipgloss.NoColor{}
var SelectedBackground = lipgloss.AdaptiveColor{Light: "#bbb", Dark: "#444"}

var cyanColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#66c2a5"}
var blackColor = lipgloss.AdaptiveColor{Light: "#fff", Dark: "#000"}
var yellowColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#ffd92f"}

// dark: https://colorbrewer2.org/#type=qualitative&scheme=Set2&n=8
var Brown = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e5c494"})
var Blue = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#8da0cb"})
var Purple = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e78ac3"})
var Yellow = lipgloss.NewStyle().Foreground(yellowColor)
var Green = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
var Red = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#fc8d62"})
var Gray = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#b3b3b3"})
var Cyan = lipgloss.NewStyle().Foreground(cyanColor)

var DispatcherComponentStyle = lipgloss.NewStyle().Background(yellowColor).Foreground(blackColor).Padding(0, 1)
var WorkersComponentStyle = lipgloss.NewStyle().Background(cyanColor).Foreground(blackColor).Padding(0, 1)
var OtherComponentStyle = lipgloss.NewStyle().Faint(true)

func Component(c lunchpail.Component) string {
	short := fmt.Sprintf("%-8s", lunchpail.ComponentShortName(c))

	switch c {
	case lunchpail.DispatcherComponent:
		return DispatcherComponentStyle.Render(short)
	case lunchpail.WorkersComponent:
		return WorkersComponentStyle.Render(short)
	}

	return OtherComponentStyle.Render(short)
}
