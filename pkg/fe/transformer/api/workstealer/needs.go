package workstealer

import (
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

// If the hlir contains an Application with Role of "Worker", then we
// will need a WorkStealer.
func IsNeeded(model hlir.HLIR) bool {
	return slices.IndexFunc(model.Applications, func(app hlir.Application) bool { return app.Spec.Role == hlir.WorkerRole }) >= 0
}
