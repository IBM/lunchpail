package util

import (
	"golang.org/x/term"
	"os"
)

func StdinIsTty() bool {
	return term.IsTerminal(int(os.Stdin.Fd()))
}

func StdoutIsTty() bool {
	return term.IsTerminal(int(os.Stdout.Fd()))
}
