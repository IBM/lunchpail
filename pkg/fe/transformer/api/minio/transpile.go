package minio

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// Transpile minio to hlir.Application
func transpile(ctx llir.Context) (hlir.Application, error) {
	app := hlir.NewApplication(ctx.Run.RunName + "-minio")

	app.Spec.Image = "docker.io/minio/minio:RELEASE.2024-07-04T14-25-45Z"
	app.Spec.Role = "queue"
	app.Spec.Expose = []string{fmt.Sprintf("%d:%d", ctx.Queue.Port, ctx.Queue.Port)}
	app.Spec.Command = fmt.Sprintf("$LUNCHPAIL_EXE component minio server --port %d --bucket %s --run %s", ctx.Queue.Port, ctx.Queue.Bucket, ctx.Run.RunName)

	/*app.Spec.Needs = []hlir.Needs{
	{Name: "minio", Version: "latest"}}*/

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["USE_MINIO_EXTENSIONS"] = "true"

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
