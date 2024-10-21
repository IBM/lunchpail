package minio

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// Transpile minio to hlir.Application
func transpile(run queue.RunContext, ir llir.LLIR) (hlir.Application, error) {
	app := hlir.NewApplication(run.RunName + "-minio")

	app.Spec.Image = "docker.io/minio/minio:RELEASE.2024-07-04T14-25-45Z"
	app.Spec.Role = "queue"
	app.Spec.Expose = []string{fmt.Sprintf("%d:%d", ir.Queue().Port, ir.Queue().Port)}
	app.Spec.Command = fmt.Sprintf("$LUNCHPAIL_EXE component minio server --port %d --bucket %s --run %s", ir.Queue().Port, ir.Queue().Bucket, run.RunName)

	/*app.Spec.Needs = []hlir.Needs{
	{Name: "minio", Version: "latest"}}*/

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["USE_MINIO_EXTENSIONS"] = "true"

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
