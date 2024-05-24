package linker

type RunSizeConfig struct {
	Workers int
	Cpu string
	Memory string
	Gpu int
}

func ordinal(size TShirtSize) uint {
	switch size {
	case AutoSize: return 0
	case XxsSize: return 1
	case XsSize: return 2
	case SmSize: return 3
	case MdSize: return 4
	case LgSize: return 5
	case XlSize: return 6
	case XxlSize: return 7
	}

	return 0
}

type RunConfigs map[TShirtSize]RunSizeConfig

var defaultConfig = RunConfigs{
	AutoSize: {1, "auto", "auto", 0},
	XxsSize: {1, "500m", "500Mi", 0},
	XsSize: {1, "1", "2Gi", 1},
	SmSize: {2, "1", "4Gi", 1},
	MdSize: {4, "2", "8Gi", 1},
	LgSize: {8, "4", "16Gi", 1},
	XlSize: {20, "4", "32Gi", 1},
	XxlSize: {40, "8", "64Gi", 1},
}

func (app *Application) sizing() RunSizeConfig {
	// for now...
	config := defaultConfig

	sizing := config[XxsSize]
	if app.Spec.MinSize != "" {
		sizing = config[app.Spec.MinSize]
	}

	if app.Spec.SupportsGpu != true {
		sizing.Gpu = 0
	}

	return sizing
}

func max(s1, s2 TShirtSize) TShirtSize {
	if ordinal(s1) > ordinal(s2) {
		return s1
	}
	return s2
}

// Applications can specify a minSize... so take the max of that and
// what the WorkerPool specifies
func (pool *WorkerPool) sizing(app Application) RunSizeConfig {
	// for now...
	config := defaultConfig

	size := max(app.Spec.MinSize, pool.Spec.Workers.Size)
	sizing := config[size]

	if app.Spec.SupportsGpu != true {
		sizing.Gpu = 0
	}

	// We allow a specific worker count override in the pool
	// spec. Note: we ignore the Application.Spec.MinSize here. Is
	// that ok?
	if pool.Spec.Workers.Count != 0 {
		sizing.Workers = pool.Spec.Workers.Count
	}

	return sizing
}
