package dispatch

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/s3"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for Dispatchers
func Lower(buildName string, ctx llir.Context, model hlir.HLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	for _, r := range model.ProcessS3Objects {
		if component, err := s3.Lower(buildName, ctx, r, opts); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
