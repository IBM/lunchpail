package api

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

type RunConfigs map[hlir.TShirtSize]llir.RunSizeConfig

var defaultConfig = RunConfigs{
	hlir.AutoSize: {Workers: 1, Cpu: "auto", Memory: "auto", Gpu: 0},
	hlir.XxsSize:  {Workers: 1, Cpu: "500m", Memory: "500Mi", Gpu: 0},
	hlir.XsSize:   {Workers: 1, Cpu: "1", Memory: "2Gi", Gpu: 0},
	hlir.SmSize:   {Workers: 2, Cpu: "1", Memory: "4Gi", Gpu: 0},
	hlir.MdSize:   {Workers: 4, Cpu: "2", Memory: "8Gi", Gpu: 0},
	hlir.LgSize:   {Workers: 8, Cpu: "4", Memory: "16Gi", Gpu: 0},
	hlir.XlSize:   {Workers: 20, Cpu: "4", Memory: "32Gi", Gpu: 0},
	hlir.XxlSize:  {Workers: 40, Cpu: "8", Memory: "64Gi", Gpu: 0},
}

func ApplicationSizing(app hlir.Application, opts build.Options) llir.RunSizeConfig {
	// for now...
	config := defaultConfig

	//TODO Default sizing for other non-Kubernetes opts.TargetPlatform?
	sizing := config[hlir.AutoSize]

	if app.Spec.MinSize != "" {
		sizing = config[app.Spec.MinSize]
	}

	if opts.HasGpuSupport {
		// TODO gpu count...
		sizing.Gpu = 1
	}

	if app.Spec.SupportsGpu != true {
		sizing.Gpu = 0
	}

	return sizing
}

// Applications can specify a minSize... so take the max of that and
// what the WorkerPool specifies
func WorkerpoolSizing(pool hlir.WorkerPool, app hlir.Application, opts build.Options) llir.RunSizeConfig {
	// for now...
	config := defaultConfig

	size := hlir.MaxTShirtSize(app.Spec.MinSize, pool.Spec.Workers.Size)
	sizing := config[size]

	if opts.HasGpuSupport {
		// TODO gpu count...
		sizing.Gpu = 1
	}

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
