package linker

type RunSizeConfig struct {
	Workers int
	Cpu string
	Memory string
	Gpu int
}

type RunSize string
const (
	RunSizeXxs RunSize = "xxs"
	RunSizeXs = "xs"
	RunSizeSm = "sm"
	RunSizeMd = "md"
	RunSizeLg = "lg"
	RunSizeXl = "xl"
	RunSizeXxl = "xxl"
)

type RunSizeConfigs map[RunSize]RunSizeConfig

var defaultConfig = RunSizeConfigs{
	RunSizeXxs: {1, "500m", "500Mi", 0},
	RunSizeXs: {1, "1", "2Gi", 1},
	RunSizeSm: {2, "1", "4Gi", 1},
	RunSizeMd: {4, "2", "8Gi", 1},
	RunSizeLg: {8, "4", "16Gi", 1},
	RunSizeXl: {20, "4", "32Gi", 1},
	RunSizeXxl: {40, "8", "64Gi", 1},
}

func (app *Application) sizing() RunSizeConfig {
	// for now...
	config := defaultConfig

	if app.Spec.MinSize == "" {
		return config[app.Spec.MinSize]
	}

	return config[RunSizeXxs]
}
