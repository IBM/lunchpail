package minio

import (
	"fmt"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// Transpile minio to hlir.Application
func transpile(runname string, ir llir.LLIR) (hlir.Application, error) {
	app := hlir.NewApplication(runname + "-minio")

	app.Spec.Image = "docker.io/minio/minio:RELEASE.2024-07-04T14-25-45Z"
	app.Spec.Role = "queue"
	app.Spec.Expose = []string{fmt.Sprintf("%d:9000", ir.Queue.Port)}
	app.Spec.Command = "/workdir/lunchpail minio server"
	/*app.Spec.Code = []hlir.Code{
		hlir.Code{
			Name:   "main.sh",
			Source: main,
		},
	}*/

	prefixIncludingBucket := api.QueuePrefixPath(ir.Queue, runname)
	A := strings.Split(prefixIncludingBucket, "/")
	prefixExcludingBucket := filepath.Join(A[1:]...)

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["USE_MINIO_EXTENSIONS"] = "true"
	app.Spec.Env["LUNCHPAIL_QUEUE_BUCKET"] = ir.Queue.Bucket
	app.Spec.Env["LUNCHPAIL_QUEUE_PREFIX"] = prefixExcludingBucket

	// Helps with tests. see ./minio.sh
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = "5"

	return app, nil
}
