package subcommands

import (
	"log"

	"github.com/spf13/cobra"
	"lunchpail.io/pkg/fe/compiler"
)

func newCompileCmd() *cobra.Command {
	var outputFlag string
	var branchFlag string
	var verboseFlag bool
	var allFlag bool

	cmd := &cobra.Command{
		Use:   "compile [path-or-git]",
		Short: "Generate a binary specialized to a given application",
		Long:  "Generate a binary specialized to a given application",
		Args:  cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
	}

	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Path to store output binary")
	if err := cmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputPath>")
	}

	cmd.Flags().StringVarP(&branchFlag, "branch", "b", branchFlag, "Git branch to pull from")
	compilationOptions := addCompilationOptions(cmd)
	cmd.Flags().BoolVarP(&allFlag, "all-platforms", "A", allFlag, "Generate binaries for all supported platform/arch combinations")
	cmd.Flags().BoolVarP(&verboseFlag, "verbose", "v", verboseFlag, "Verbose output")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		sourcePath := ""
		if len(args) >= 1 {
			sourcePath = args[0]
		}

		return compiler.Compile(sourcePath, compiler.Options{
			Name:               outputFlag,
			Branch:             branchFlag,
			Verbose:            verboseFlag,
			AllPlatforms:       allFlag,
			CompilationOptions: *compilationOptions,
		})
	}

	return cmd
}

func init() {
	rootCmd.AddCommand(newCompileCmd())
}
