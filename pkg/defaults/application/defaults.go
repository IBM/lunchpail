package application

import "lunchpail.io/pkg/ir/hlir"

func WithDefaults(app hlir.Application) hlir.Application {
	if app.Spec.Image == "" {
		app.Spec.Image = "docker.io/alpine:3"
	}

	return app
}
