package workstealer

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile workstealer to hlir.Application
func transpile(runname string, ir llir.LLIR, opts build.LogOptions) (hlir.Application, error) {
	app := hlir.NewApplication(runname + "-workstealer")

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "workstealer"
	app.Spec.Command = fmt.Sprintf("$LUNCHPAIL_EXE component workstealer run --verbose=%v --debug=%v --run %s --unassigned %s --outbox %s --finished %s --worker-inbox-base %s --worker-processing-base %s --worker-outbox-base %s --worker-killfile-base %s", opts.Verbose, opts.Debug, runname, api.UnassignedPath(ir.Queue, runname), api.OutboxPath(ir.Queue, runname), api.FinishedPath(ir.Queue, runname), api.WorkerInboxPathBase(ir.Queue, runname), api.WorkerProcessingPathBase(ir.Queue, runname), api.WorkerOutboxPathBase(ir.Queue, runname), api.WorkerKillfilePathBase(ir.Queue, runname))

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["LUNCHPAIL_RUN_NAME"] = runname

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
