package s3

import (
	"fmt"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

// Transpile hlir.ProcessS3Objects to hlir.Application
func transpile(s3 hlir.ProcessS3Objects) (hlir.Application, error) {
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

	envPrefix := "LUNCHPAIL_PROCESS_S3_OBJECTS_"
	app.Spec.Command = fmt.Sprintf("lunchpail enqueue s3 --repeat %d %s %s", repeat, s3.Spec.Path, envPrefix)

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
