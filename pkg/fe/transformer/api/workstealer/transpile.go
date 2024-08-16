package workstealer

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile workstealer to hlir.Application
func transpile(runname string, queueSpec queue.Spec) (hlir.Application, error) {
	app := hlir.NewApplication(runname + "-workstealer")

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "workstealer"
	app.Spec.Command = "lunchpail workstealer"

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")
	app.Spec.Env["LUNCHPAIL_RUN_NAME"] = runname

	return app, nil
}
