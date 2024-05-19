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

var blackColor = lipgloss.AdaptiveColor{Light: "#fff", Dark: "#000"}
var blueColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#8da0cb"}
var brownColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e5c494"}
var cyanColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#66c2a5"}
var grayColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a3a3a3"}
var yellowColor = lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#ffd92f"}

// dark: https://colorbrewer2.org/#type=qualitative&scheme=Set2&n=8
var Brown = lipgloss.NewStyle().Foreground(brownColor)
var Blue = lipgloss.NewStyle().Foreground(blueColor)
var Purple = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e78ac3"})
var Yellow = lipgloss.NewStyle().Foreground(yellowColor)
var Green = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
var Red = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#fc8d62"})
var Gray = lipgloss.NewStyle().Foreground(grayColor)
var Cyan = lipgloss.NewStyle().Foreground(cyanColor)

// https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=5
var DispatcherComponentStyle = lipgloss.NewStyle().Background(lipgloss.Color("#1f78b4")).Foreground(blackColor).Padding(0, 1)
var WorkersComponentStyle = lipgloss.NewStyle().Background(lipgloss.Color("#a6cee3")).Foreground(blackColor).Padding(0, 1)
var OtherComponentStyle = lipgloss.NewStyle().Padding(0, 1)

func ComponentStyle(c lunchpail.Component) lipgloss.Style {
	switch c {
	case lunchpail.DispatcherComponent:
		return DispatcherComponentStyle
	case lunchpail.WorkersComponent:
		return WorkersComponentStyle
	}

	return OtherComponentStyle
}

func Component(c lunchpail.Component) string {
	short := fmt.Sprintf("%-8s", lunchpail.ComponentShortName(c))

	return ComponentStyle(c).Render(short)
}
