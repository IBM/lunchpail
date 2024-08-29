package common

import "lunchpail.io/pkg/be/options"

type Options struct {
	options.CliOptions
	NeedsServiceAccount            bool
	NeedsSecurityContextConstraint bool
}
