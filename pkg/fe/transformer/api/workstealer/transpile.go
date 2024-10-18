package workstealer

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile workstealer to hlir.Application
func transpile(runname string, ir llir.LLIR, opts build.LogOptions) (hlir.Application, error) {
	step := 0 // TODO
	app := hlir.NewApplication(runname + "-workstealer")

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "workstealer"
	app.Spec.Command = fmt.Sprintf("$LUNCHPAIL_EXE component workstealer run --verbose=%v --debug=%v --bucket %s --run %s --step %d",
		opts.Verbose,
		opts.Debug,
		ir.Queue.Bucket,
		runname,
		step,
	)

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["LUNCHPAIL_RUN_NAME"] = runname

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
