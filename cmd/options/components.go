package options

import (
	"github.com/spf13/cobra"

	"lunchpail.io/pkg/lunchpail"
)

func AddComponentOption(cmd *cobra.Command) *lunchpail.Component {
	var component lunchpail.Component

	cmd.Flags().VarP(&component, "component", "c", "Component to track")

	return &component
}
