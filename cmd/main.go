package main

import (
	"go.uber.org/automaxprocs/maxprocs"

	"lunchpail.io/cmd/subcommands"
)

func main() {
	// Automatically set GOMAXPROCS to match Linux container CPU quota.
	// https://github.com/uber-go/automaxprocs
	maxprocs.Set()

	subcommands.Execute()
}
