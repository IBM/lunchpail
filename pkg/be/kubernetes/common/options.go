package common

import "lunchpail.io/pkg/ir/llir"

type Options struct {
	llir.Options
	NeedsServiceAccount            bool
	NeedsSecurityContextConstraint bool
}
