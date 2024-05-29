package colors

import (
	"fmt"

	"github.com/charmbracelet/lipgloss"
	"lunchpail.io/pkg/observe"
)

var Dim = lipgloss.NewStyle().Faint(true)
var Bold = lipgloss.NewStyle().Bold(true)
var SelectedForeground = lipgloss.NoColor{}
var SelectedBackground = lipgloss.AdaptiveColor{Light: "#bbb", Dark: "#444"}

// dark: https://colorbrewer2.org/#type=qualitative&scheme=Set2&n=8
var Brown = lipgloss.NewStyle().Foreground(brownColor)
var Blue = lipgloss.NewStyle().Foreground(blueColor)
var Purple = lipgloss.NewStyle().Foreground(purpleColor)
var Yellow = lipgloss.NewStyle().Foreground(yellowColor)
var Green = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
var Red = lipgloss.NewStyle().Foreground(redColor)
var Gray = lipgloss.NewStyle().Foreground(grayColor)
var Cyan = lipgloss.NewStyle().Foreground(cyanColor)

// https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=5
var DispatcherComponentStyle = lipgloss.NewStyle().Background(lipgloss.Color("#1f78b4")).Foreground(blackColor).Padding(0, 1)
var WorkersComponentStyle = lipgloss.NewStyle().Background(lipgloss.Color("#a6cee3")).Foreground(blackColor).Padding(0, 1)
var ResourceComponentStyle = lipgloss.NewStyle().Background(lightyellowColor).Foreground(blackColor).Padding(0, 1)
var OtherComponentStyle = lipgloss.NewStyle().Background(grayColor).Foreground(blackColor).Padding(0, 1)
var ErrorComponentStyle = lipgloss.NewStyle().Background(redColor).Foreground(blackColor).Padding(0, 1)

func ComponentStyle(c observe.Component) lipgloss.Style {
	switch c {
	case observe.DispatcherComponent:
		return DispatcherComponentStyle
	case observe.WorkersComponent:
		return WorkersComponentStyle
	}

	return OtherComponentStyle
}

func Component(c observe.Component) string {
	short := fmt.Sprintf("%-8s", observe.ComponentShortName(c))

	return ComponentStyle(c).Render(short)
}
