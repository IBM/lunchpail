package common

import "lunchpail.io/pkg/compilation"

type Options struct {
	compilation.Options
	NeedsServiceAccount            bool
	NeedsSecurityContextConstraint bool
}
