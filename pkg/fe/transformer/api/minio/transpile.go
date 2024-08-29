package minio

import (
	"fmt"
	"os"
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
	app.Spec.Command = "$LUNCHPAIL_EXE minio server"

	prefixIncludingBucket := api.QueuePrefixPath(ir.Queue, runname)
	A := strings.Split(prefixIncludingBucket, "/")
	prefixExcludingBucket := filepath.Join(A[1:]...)

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["USE_MINIO_EXTENSIONS"] = "true"
	app.Spec.Env["LUNCHPAIL_QUEUE_BUCKET"] = ir.Queue.Bucket
	app.Spec.Env["LUNCHPAIL_QUEUE_PREFIX"] = prefixExcludingBucket

	// This can help with tests
	app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = os.Getenv("LUNCHPAIL_SLEEP_BEFORE_EXIT")

	return app, nil
}
