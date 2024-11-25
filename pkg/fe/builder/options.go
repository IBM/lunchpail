package builder

import "lunchpail.io/pkg/fe/builder/overlay"

type Options struct {
	Name           string
	AllPlatforms   bool
	OverlayOptions overlay.Options
}

func (opts Options) Verbose() bool {
	return opts.OverlayOptions.Verbose()
}
