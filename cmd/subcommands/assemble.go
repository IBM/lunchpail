package subcommands

import (
	"github.com/spf13/cobra"
	"log"
	"lunchpail.io/pkg/assembler"
)

func newAssembleCmd() *cobra.Command {
	var appNameFlag string
	var outputFlag string
	var branchFlag string
	var verboseFlag bool

	cmd := &cobra.Command{
		Use:   "assemble path-or-git",
		Short: "Generate a binary specialized to a given application",
		Long:  "Generate a binary specialized to a given application",
		Args:  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return assembler.Assemble(args[0], assembler.Options{outputFlag, appNameFlag, branchFlag, verboseFlag})
		},
	}

	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Path to store output binary")
	if err := cmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputPath>")
	}

	cmd.Flags().StringVarP(&appNameFlag, "app-name", "a", "", "[Advanced] Override default/inferred application name")
	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")

	return cmd
}

func init() {
	rootCmd.AddCommand(newAssembleCmd())
}
