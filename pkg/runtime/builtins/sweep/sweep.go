package sweep

import (
	"strconv"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
)

func App(min, max, step, intervalSeconds int, wait bool, opts build.Options) hlir.HLIR {
	app := hlir.NewWorkerApplication("sweep")
	app.Spec.IsDispatcher = true
	app.Spec.Command = "./main.sh"
	app.Spec.Image = "docker.io/alpine:3"
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: main},
	}

	app.Spec.Env = hlir.Env{}
	for k, v := range opts.Env {
		app.Spec.Env[k] = v
	}
	app.Spec.Env["__LUNCHPAIL_SWEEP_MIN"] = strconv.Itoa(min)
	app.Spec.Env["__LUNCHPAIL_SWEEP_MAX"] = strconv.Itoa(max)

	if step > 0 {
		app.Spec.Env["__LUNCHPAIL_SWEEP_STEP"] = strconv.Itoa(step)
	}

	if intervalSeconds > 0 {
		app.Spec.Env["__LUNCHPAIL_INTERVAL"] = strconv.Itoa(intervalSeconds)
	}

	if wait {
		app.Spec.Env["__LUNCHPAIL_WAIT"] = "true"
	}

	if opts.Log.Verbose {
		app.Spec.Env["__LUNCHPAIL_VERBOSE"] = "true"
	}

	if opts.Log.Debug {
		app.Spec.Env["__LUNCHPAIL_DEBUG"] = "true"
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
		WorkerPools:  []hlir.WorkerPool{hlir.NewPool("p1", 1)},
	}
}
