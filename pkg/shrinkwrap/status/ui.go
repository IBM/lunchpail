package status

import (
	"strings"

	"golang.org/x/term"
	"lunchpail.io/pkg/runs"
	"github.com/charmbracelet/bubbles/table"
	tea "github.com/charmbracelet/bubbletea"
)

type Options struct {
	Namespace string
	Watch     bool
	Verbose   bool
	Summary   bool
}

type model struct {
	c chan Model
	table table.Model
	opts Options
	footer []string
}

type channelMsg struct {
	model Model
}

func waitForActivity(c chan Model) tea.Cmd {
	return func() tea.Msg {
		// Consume one channel message and pass it on. Next
		// stop: Update()
		return channelMsg{<-c}
	}
}

func (m model) Init() tea.Cmd {
	return waitForActivity(m.c)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	switch msg := msg.(type) {
	case channelMsg:
		if width, height, err := term.GetSize(1); err == nil {
			r, footer := rows(msg.model, width, m.opts.Summary)
			m.footer = footer
			m.table.SetWidth(width)
			m.table.SetHeight(height - len(footer))
			m.table.SetColumns([]table.Column{
				{Title: "", Width: 15},
				{Title: "", Width: width},
			})
			m.table.SetRows(r)
		}
		return m, waitForActivity(m.c)

	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			if m.table.Focused() {
				m.table.Blur()
			} else {
				m.table.Focus()
			}
		case "ctrl+c":
			return m, tea.Quit
		}
	}
	m.table, cmd = m.table.Update(msg)
	return m, cmd
}

func (m model) View() string {
	return m.table.View() + "\n" + strings.Join(m.footer, "\n")
}

func UI(runnameIn string, opts Options) error {
	appname, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, opts.Watch)
	if err != nil {
		return err
	}

	c, _, err := StatusStreamer(appname, runname, namespace, opts.Verbose)
	if err != nil {
		return err
	}
	defer close(c)

	s := table.DefaultStyles()
	s.Selected = s.Selected.
		Foreground(normalText).
		Bold(false)
	s.Cell = s.Cell.
		Padding(0, 0)
	t := table.New(
		table.WithStyles(s),
		table.WithFocused(true),
	)

	p := tea.NewProgram(model{c, t, opts, []string{}}, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		return err
	}
	
	return nil
}
