package hlir

import "slices"

type AppModel struct {
	Applications []Application
	WorkerPools  []WorkerPool
	RepoSecrets  []RepoSecret
	Others       []UnknownResource
}

func (model *AppModel) GetApplicationByName(appname string) (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Metadata.Name == appname })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}

func (model *AppModel) GetApplicationByRole(role Role) (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Spec.Role == role })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}
