package subcommands

import (
	"log"

	"github.com/spf13/cobra"
	"lunchpail.io/pkg/fe/assembler"
)

func newAssembleCmd() *cobra.Command {
	var outputFlag string
	var sourceFlag string
	var branchFlag string
	var verboseFlag bool
	var allFlag bool

	cmd := &cobra.Command{
		Use:   "assemble",
		Short: "Generate a binary specialized to a given application",
		Long:  "Generate a binary specialized to a given application",
	}

	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Path to store output binary")
	if err := cmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputPath>")
	}
	cmd.Flags().StringVarP(&sourceFlag, "source", "S", sourceFlag, "Path to source directory or git repository uri")
	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	assemblyOptions := addAssemblyOptions(cmd)
	cmd.Flags().BoolVarP(&allFlag, "all-platforms", "A", allFlag, "Generate binaries for all supported platform/arch combinations")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return assembler.Assemble(assembler.Options{
			Name:            outputFlag,
			Source:          sourceFlag,
			Branch:          branchFlag,
			Verbose:         verboseFlag,
			AllPlatforms:    allFlag,
			AssemblyOptions: *assemblyOptions,
		})
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newAssembleCmd())
}
