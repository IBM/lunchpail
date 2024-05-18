package status

import (
	"os"
	"strings"

	"github.com/charmbracelet/bubbles/table"
	tea "github.com/charmbracelet/bubbletea"
	"golang.org/x/term"
	"lunchpail.io/pkg/runs"
	"lunchpail.io/pkg/views"
)

// Options to our status UI component
type Options struct {
	Namespace string
	Watch     bool
	Verbose   bool
	Summary   bool
	Nloglines int
}

// Our model for BubbleTea
type model struct {
	c              chan Model
	table          table.Model
	opts           Options
	footer         []string
	selectedRowIdx int
	rows           []statusRow
}

// Some necessary plumbing for BubbleTea: we need to cast our channel
// that produces Model structs into a BubbleTea "Msg". This type is
// our Msg model, which just wraps our status Model.
type channelMsg struct {
	model Model
}

// Another part of adapting our channels to the BubbleTea Cmd/Msg
// model. It just waits for an event on our channel, and then wraps it
// in a Msg (channelMsg), which will then be passed (by BubbleTea) to
// our func Update()
func waitForActivity(c chan Model) tea.Cmd {
	return func() tea.Msg {
		// Consume one channel message and pass it on. Next
		// stop: func Update() case channelMsg
		return channelMsg{<-c}
	}
}

// The BubbleTea init lifecycle handler
func (m model) Init() tea.Cmd {
	return waitForActivity(m.c)
}

// The BubbleTea update lifecycle handler. Called when a Msg is
// received.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	switch msg := msg.(type) {
	case channelMsg:
		if width, height, err := term.GetSize(1); err == nil {
			r, col1Width, footer := rows(msg.model, width, height, m.opts.Summary)
			m.footer = footer
			// m.table.SetWidth(width)
			m.table.SetHeight(height - len(footer))
			m.table.SetColumns([]table.Column{
				{Title: "", Width: col1Width},
				{Title: "", Width: width},
			})

			// ugh, we need to copy over to tea's
			// table.Row structs
			// https://github.com/charmbracelet/bubbles/discussions/392
			teaRows := []table.Row{}
			for _, row := range r {
				teaRows = append(teaRows, row.row)
			}

			m.rows = r
			m.table.SetRows(teaRows)
		}

		// We have now finished processing one event received
		// on our channel. We respond to BubbleTea that our
		// next Cmd is to wait for the next message on the
		// channel.
		return m, waitForActivity(m.c)

	case tea.KeyMsg:
		switch msg.String() {
		case "up":
			m.selectedRowIdx = max(0, m.selectedRowIdx-1)
		case "down":
			m.selectedRowIdx = min(len(m.rows)-1, m.selectedRowIdx+1)
		case "+", "-":
			row := m.rows[m.selectedRowIdx]
			if row.pool != nil {
				delta := 1
				if msg.String() == "-" {
					delta = -1
				}
				// log.Printf("Updating pool parallelism pool=%s currentParallelism=%d delta=%d\n", row.pool.Name, row.pool.Parallelism, delta)
				if err := row.pool.changeWorkers(delta); err != nil {
					// log.Printf("Error updating pool parallelism pool=%s delta=%d: %v\n", row.pool.Name, delta, err)
				}
			}
		case "ctrl+c":
			return m, tea.Quit
		}
	}
	m.table, cmd = m.table.Update(msg)
	return m, cmd
}

// The BubbleTea view lifecycle handler
func (m model) View() string {
	return m.table.View() + "\n" + strings.Join(m.footer, "\n")
}

func UI(runnameIn string, opts Options) error {
	appname, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, opts.Watch)
	if err != nil {
		return err
	}

	if len(os.Getenv("DEBUG")) > 0 {
		f, err := tea.LogToFile("debug.log", "debug")
		if err != nil {
			return err
		}
		defer f.Close()
	}

	c, _, err := StatusStreamer(appname, runname, namespace, opts.Verbose, opts.Nloglines)
	if err != nil {
		return err
	}
	defer close(c)

	s := table.DefaultStyles()
	s.Selected = s.Selected.
		Foreground(views.SelectedForeground).
		Background(views.SelectedBackground).
		Bold(false)
	s.Cell = s.Cell.
		Padding(0, 0)
	t := table.New(
		table.WithStyles(s),
		table.WithFocused(true),
	)

	p := tea.NewProgram(model{c, t, opts, []string{}, 0, []statusRow{}}, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		return err
	}

	return nil
}
