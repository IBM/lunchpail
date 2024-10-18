package s3

import (
	"fmt"
	"strings"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile hlir.ProcessS3Objects to hlir.Application
func transpile(runname string, s3 hlir.ProcessS3Objects) (hlir.Application, error) {
	app := hlir.NewApplication(s3.Metadata.Name)

	if s3.Spec.Rclone.RemoteName == "" {
		return app, fmt.Errorf("process s3 objects %s rclone remote name is missing", s3.Metadata.Name)
	}
	if s3.Spec.Path == "" {
		return app, fmt.Errorf("process s3 objects %s path is missing", s3.Metadata.Name)
	}

	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail:%s", lunchpail.ImageRegistry, lunchpail.ImageRepo, lunchpail.Version())
	app.Spec.Role = "dispatcher"

	repeat := 1
	if s3.Spec.Repeat > 0 {
		repeat = s3.Spec.Repeat
	}

	var verbose string
	if s3.Spec.Verbose {
		verbose = "--verbose"
	}

	var debug string
	if s3.Spec.Debug {
		debug = "--debug"
	}

	envPrefix := "LUNCHPAIL_PROCESS_S3_OBJECTS_"
	app.Spec.Command = strings.Join([]string{
		fmt.Sprintf(`trap "$LUNCHPAIL_EXE queue done --run %s" EXIT`, runname),
		fmt.Sprintf("$LUNCHPAIL_EXE queue add s3 --run %s --repeat %d %s %s %s %s", runname, repeat, verbose, debug, s3.Spec.Path, envPrefix),
	}, "\n")

	app.Spec.Env = hlir.Env{}
	for key, value := range s3.Spec.Env {
		app.Spec.Env[key] = value
	}

	app.Spec.Datasets = []hlir.Dataset{
		hlir.Dataset{
			Name: "origin",
			S3: hlir.S3{
				Rclone: s3.Spec.Rclone,
				EnvFrom: hlir.EnvFrom{
					Prefix: envPrefix,
				},
			},
		},
	}

	return app, nil
}
