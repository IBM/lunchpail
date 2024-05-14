package status

import "github.com/charmbracelet/lipgloss"

var dim = lipgloss.NewStyle().Faint(true)
var bold = lipgloss.NewStyle().Bold(true)
var normalText = lipgloss.NoColor{}

// dark: https://colorbrewer2.org/#type=qualitative&scheme=Set2&n=8
var brown = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e5c494"})
var blue = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#8da0cb"})
var purple = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#e78ac3"})
var yellow = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#ffd92f"})
var green = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
var red = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#fc8d62"})
var gray = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#b3b3b3"})
var cyan = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#66c2a5"})
