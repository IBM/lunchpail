package info

import (
	"fmt"
	"github.com/charmbracelet/lipgloss"
)

func UI(opts Options) error {
	c, err := Model(opts)
	if err != nil {
		return err
	}
	defer close(c)

	bold := lipgloss.NewStyle().Bold(true).Faint(true)	
	for info := range c {
		fmt.Printf("%-24s %s\n", bold.Render("Name"),info.Name)
		fmt.Printf("%-24s %s\n", bold.Render("Namespace"),info.Namespace)
		fmt.Printf("%-24s %s\n", bold.Render("Assembly Date"),info.AssemblyDate)

		if !opts.Follow {
			break
		}
	}

	return nil
}
