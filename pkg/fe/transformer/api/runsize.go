package api

import "lunchpail.io/pkg/ir/hlir"

type RunSizeConfig struct {
	Workers int
	Cpu     string
	Memory  string
	Gpu     int
}

type RunConfigs map[hlir.TShirtSize]RunSizeConfig

var defaultConfig = RunConfigs{
	hlir.AutoSize: {1, "auto", "auto", 0},
	hlir.XxsSize:  {1, "500m", "500Mi", 0},
	hlir.XsSize:   {1, "1", "2Gi", 1},
	hlir.SmSize:   {2, "1", "4Gi", 1},
	hlir.MdSize:   {4, "2", "8Gi", 1},
	hlir.LgSize:   {8, "4", "16Gi", 1},
	hlir.XlSize:   {20, "4", "32Gi", 1},
	hlir.XxlSize:  {40, "8", "64Gi", 1},
}

func ApplicationSizing(app hlir.Application) RunSizeConfig {
	// for now...
	config := defaultConfig

	sizing := config[hlir.AutoSize]
	if app.Spec.MinSize != "" {
		sizing = config[app.Spec.MinSize]
	}

	if app.Spec.SupportsGpu != true {
		sizing.Gpu = 0
	}

	return sizing
}

// Applications can specify a minSize... so take the max of that and
// what the WorkerPool specifies
func WorkerpoolSizing(pool hlir.WorkerPool, app hlir.Application) RunSizeConfig {
	// for now...
	config := defaultConfig

	size := hlir.MaxTShirtSize(app.Spec.MinSize, pool.Spec.Workers.Size)
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
