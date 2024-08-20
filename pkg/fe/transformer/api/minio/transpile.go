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
func transpile(runname string, spec llir.ShellSpec) (hlir.Application, error) {
	app := hlir.NewApplication(runname + "-minio")

	app.Spec.Image = "docker.io/minio/minio:RELEASE.2024-07-04T14-25-45Z"
	app.Spec.Role = "queue"
	app.Spec.Expose = []string{fmt.Sprintf("%d:9000", spec.Queue.Port)}
	app.Spec.Command = "./main.sh"
	app.Spec.Code = []hlir.Code{
		hlir.Code{
			Name:   "main.sh",
			Source: main,
		},
	}

	prefixIncludingBucket := api.QueuePrefixPath(spec.Queue, runname)
	A := strings.Split(prefixIncludingBucket, "/")
	prefixExcludingBucket := filepath.Join(A[1:]...)

	app.Spec.Env = hlir.Env{}
	app.Spec.Env["USE_MINIO_EXTENSIONS"] = "true"
	app.Spec.Env["LUNCHPAIL_QUEUE_BUCKET"] = spec.Queue.Bucket
	app.Spec.Env["LUNCHPAIL_QUEUE_PREFIX"] = prefixExcludingBucket

	if os.Getenv("CI") != "" {
		// Helps with tests. see ./minio.sh
		app.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = "5"
	}

	return app, nil
}
