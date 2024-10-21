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
func transpile(ctx llir.Context, opts build.LogOptions) (hlir.Application, error) {
	app := hlir.NewApplication(ctx.Run.RunName + "-workstealer")

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "workstealer"
	app.Spec.Command = fmt.Sprintf("$LUNCHPAIL_EXE component workstealer run --verbose=%v --debug=%v",
		opts.Verbose,
		opts.Debug,
	)

	app.Spec.Env = hlir.Env{}

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
