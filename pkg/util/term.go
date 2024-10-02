package util

import (
	"golang.org/x/term"
	"os"
)

func StdoutIsTty() bool {
	return term.IsTerminal(int(os.Stdout.Fd()))
}
