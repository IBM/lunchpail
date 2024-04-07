package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap"

	"log"
	"github.com/spf13/cobra"
)

var maxFlag bool = false
var outputFlag string

var CoreCmd = &cobra.Command{
	Use: "core [flags] sourcePath",
	Short: "Shrinkwrap the core",
	Long:  "Shrinkwrap the core",
	Args: cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	RunE: func(cmd *cobra.Command, args []string) error {
		shrinkwrap.Core(args[0], outputFlag, maxFlag)
		return nil
	},
}

func init() {
	CoreCmd.Flags().BoolVarP(&maxFlag, "max", "m", false, "Include Ray, Torch, etc. support")

	CoreCmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Output file path, using - for stdout")
	if err := CoreCmd.MarkFlagRequired("output"); err != nil {
		log.Fatalf("Required option -o/--output <outputFilePath>")
	}
}
