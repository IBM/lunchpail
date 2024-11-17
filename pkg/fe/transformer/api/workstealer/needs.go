package workstealer

import "lunchpail.io/pkg/ir/hlir"

// If the hlir contains an Application with Role of "Worker", then we
// will need a WorkStealer.
func IsNeeded(model hlir.HLIR) bool {
	_, found := model.GetWorkerApplication()
	return found
}
