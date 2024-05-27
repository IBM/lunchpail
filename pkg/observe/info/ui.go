package info

import (
	"fmt"
	"gopkg.in/yaml.v3"
	"lunchpail.io/pkg/observe/colors"
	"strings"
)

func UI() error {
	info, err := Model()
	if err != nil {
		return err
	}

	bold := colors.Bold.Faint(true)

	fmt.Printf("%-24s %s\n", bold.Render("Name"), colors.Cyan.Render(info.Name))
	fmt.Printf("%-24s %s\n", bold.Render("Created By"), info.By)
	fmt.Printf("%-24s %s\n", bold.Render("Created On"), info.On)
	fmt.Printf("%-24s %s\n", bold.Render("Creation Date"), info.Date)

	optsBytes, err := yaml.Marshal(info.ShrinkwrappedOptions)
	if err != nil {
		return err
	}

	optsString := strings.TrimSpace(string(optsBytes))
	fmt.Printf("\n%s\n", bold.Render("Shrinkwrapped Values"))
	if optsString == "{}" {
		optsString = "none"
	}
	fmt.Println(colors.Yellow.Render(optsString))

	return nil
}
