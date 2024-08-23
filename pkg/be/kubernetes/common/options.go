package common

import "lunchpail.io/pkg/be/platform"

type Options struct {
	platform.CliOptions
	NeedsServiceAccount            bool
	NeedsSecurityContextConstraint bool
}
