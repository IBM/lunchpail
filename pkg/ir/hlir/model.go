package hlir

import "slices"

type HLIR struct {
	Applications []Application
	WorkerPools  []WorkerPool
	Others       []UnknownResource
}

func (model HLIR) GetApplicationByRole(role Role) (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Spec.Role == role })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}
