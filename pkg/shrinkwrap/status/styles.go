package status

import "github.com/charmbracelet/lipgloss"

var purple = lipgloss.NewStyle().Foreground(lipgloss.Color("5"))
var dim = lipgloss.NewStyle().Faint(true)
var bold = lipgloss.NewStyle().Bold(true)

var yellow = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#ffd92f"})
var green = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#a6d854"})
var red = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#fc8d62"})
var gray = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#b3b3b3"})
var cyan = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#33a02c", Dark: "#66c2a5"})
