package hlir

import "slices"

type HLIR struct {
	Applications     []Application
	ParameterSweeps  []ParameterSweep
	ProcessS3Objects []ProcessS3Objects
	WorkerPools      []WorkerPool
	Others           []UnknownResource
}

func (model *HLIR) GetApplicationByName(appname string) (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Metadata.Name == appname })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}

func (model *HLIR) GetApplicationByRole(role Role) (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Spec.Role == role })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}
