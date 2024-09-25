package queue

import (
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/subcommands/queue/add"
)

func Add() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "add",
		Short: "Commands that help with enqueueing work tasks",
		Long:  "Commands that help with enqueueing work tasks",
	}

	cmd.AddCommand(add.File())
	cmd.AddCommand(add.S3())

	return cmd
}
