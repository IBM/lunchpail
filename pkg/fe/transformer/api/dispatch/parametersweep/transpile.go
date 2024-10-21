package parametersweep

import (
	"fmt"
	"strconv"
	"strings"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile hlir.ParameterSweep to hlir.Application
func transpile(sweep hlir.ParameterSweep) (hlir.Application, error) {
	app := hlir.NewApplication(sweep.Metadata.Name)

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "dispatcher"

	app.Spec.Command = strings.Join([]string{
		`trap "$LUNCHPAIL_EXE queue done" EXIT`,
		"./main.sh",
	}, "\n")

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

	if sweep.Spec.Wait {
		app.Spec.Env["__LUNCHPAIL_WAIT"] = "true"
	}

	if sweep.Spec.Verbose {
		app.Spec.Env["__LUNCHPAIL_VERBOSE"] = "true"
	}

	if sweep.Spec.Debug {
		app.Spec.Env["__LUNCHPAIL_DEBUG"] = "true"
	}

	return app, nil
}
