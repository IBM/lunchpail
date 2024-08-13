package parametersweep

import (
	"fmt"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
	"strconv"
)

// Transpile hlir.ParameterSweep to hlir.Application
func transpile(sweep hlir.ParameterSweep) (hlir.Application, error) {
	app := hlir.NewApplication(sweep.Metadata.Name)

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "dispatcher"
	app.Spec.Command = "./main.sh"
	app.Spec.Code = []hlir.Code{
		hlir.Code{
			Name:   "main.sh",
			Source: main,
		},
	}

	if sweep.Spec.Min < 0 {
		return app, fmt.Errorf("parameter sweep %s min should be >= 0, got %d", sweep.Metadata.Name, sweep.Spec.Min)
	}
	if sweep.Spec.Max <= 0 {
		return app, fmt.Errorf("parameter sweep %s max should be >= 0, got %d", sweep.Metadata.Name, sweep.Spec.Max)
	}
	if sweep.Spec.Max <= sweep.Spec.Min {
		return app, fmt.Errorf("parameter sweep %s max should be >= min, got %d", sweep.Metadata.Name, sweep.Spec.Max)
	}
	if sweep.Spec.Step <= 0 {
		return app, fmt.Errorf("parameter sweep %s step should be >= 0, got %d", sweep.Metadata.Name, sweep.Spec.Step)
	}
	if sweep.Spec.Interval < 0 {
		return app, fmt.Errorf("parameter sweep %s interval should be > 0, got %d", sweep.Metadata.Name, sweep.Spec.Interval)
	}

	app.Spec.Env = hlir.Env{}
	for key, value := range sweep.Spec.Env {
		app.Spec.Env[key] = value
	}

	app.Spec.Env["__LUNCHPAIL_METHOD"] = "parametersweep"
	app.Spec.Env["__LUNCHPAIL_SWEEP_MIN"] = strconv.Itoa(sweep.Spec.Min)
	app.Spec.Env["__LUNCHPAIL_SWEEP_MAX"] = strconv.Itoa(sweep.Spec.Max)

	if sweep.Spec.Step > 0 {
		app.Spec.Env["__LUNCHPAIL_SWEEP_STEP"] = strconv.Itoa(sweep.Spec.Step)
	}

	if sweep.Spec.Interval > 0 {
		app.Spec.Env["__LUNCHPAIL_INTERVAL"] = strconv.Itoa(sweep.Spec.Interval)
	}

	return app, nil
}
