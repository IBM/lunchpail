package hlir

import "slices"

type HLIR struct {
	Applications []Application
	WorkerPools  []WorkerPool
	Others       []UnknownResource
}

func (model HLIR) GetWorkerApplication() (Application, bool) {
	idx := slices.IndexFunc(model.Applications, func(app Application) bool { return app.Spec.Role == workerRole || app.Spec.Role == "" })
	if idx < 0 {
		return Application{}, false
	}

	return model.Applications[idx], true
}

func (model HLIR) SupportApplications() <-chan Application {
	c := make(chan Application)

	go func() {
		defer close(c)
		for _, app := range model.Applications {
			if app.Spec.Role == supportRole {
				c <- app
			}
		}
	}()

	return c
}
