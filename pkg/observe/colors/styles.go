package colors

import (
	"fmt"

	"github.com/charmbracelet/lipgloss"

	"lunchpail.io/pkg/lunchpail"
)

var Dim = lipgloss.NewStyle().Faint(true)
var Bold = lipgloss.NewStyle().Bold(true)
var SelectedForeground = lipgloss.NoColor{}
var SelectedBackground = lipgloss.AdaptiveColor{Light: "#bbb", Dark: "#444"}

var Brown = lipgloss.NewStyle().Foreground(lightbrownColor)
var Blue = lipgloss.NewStyle().Foreground(blueColor)
var LightPurple = lipgloss.NewStyle().Foreground(lightpurpleColor)
var Purple = lipgloss.NewStyle().Foreground(purpleColor)
var Yellow = lipgloss.NewStyle().Foreground(yellowColor)
var Green = lipgloss.NewStyle().Foreground(greenColor)
var Red = lipgloss.NewStyle().Foreground(redColor)
var Gray = lipgloss.NewStyle().Foreground(grayColor)
var Cyan = lipgloss.NewStyle().Foreground(cyanColor)

// https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=5
var DispatcherMessageStyle = lipgloss.NewStyle().Foreground(blueColor)
var DispatcherComponentStyle = lipgloss.NewStyle().Background(blueColor).Foreground(blackColor).Padding(0, 1)

var WorkersMessageStyle = lipgloss.NewStyle().Foreground(lightblueColor)
var WorkersComponentStyle = lipgloss.NewStyle().Background(lightblueColor).Foreground(blackColor).Padding(0, 1)

var WorkStealerMessageStyle = lipgloss.NewStyle().Foreground(lightbrownColor).Faint(true)
var WorkStealerComponentStyle = lipgloss.NewStyle().Background(lightbrownColor).Foreground(blackColor).Padding(0, 1)

var ClusterComponentStyle = lipgloss.NewStyle().Background(grayColor).Foreground(blackColor).Padding(0, 1)
var OtherComponentStyle = lipgloss.NewStyle().Bold(true).Padding(0, 1)
var ErrorComponentStyle = lipgloss.NewStyle().Background(redColor).Foreground(blackColor).Padding(0, 1)

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
