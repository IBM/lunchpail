package s3

import (
	"fmt"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
	"strconv"
)

// Transpile hlir.ProcessS3Objects to hlir.Application
func transpile(s3 hlir.ProcessS3Objects) (hlir.Application, error) {
	app := hlir.Application{}

	if s3.Spec.Secret == "" {
		return app, fmt.Errorf("process s3 objects %s secret is missing", s3.Metadata.Name)
	}
	if s3.Spec.Path == "" {
		return app, fmt.Errorf("process s3 objects %s path is missing", s3.Metadata.Name)
	}

	app.ApiVersion = s3.ApiVersion
	app.Kind = "Application"
	app.Metadata.Name = s3.Metadata.Name
	app.Spec.Image = fmt.Sprintf("%s/%s/lunchpail-rclone:0.0.1", lunchpail.ImageRegistry, lunchpail.ImageRepo)
	app.Spec.Api = "shell"
	app.Spec.Role = "dispatcher"
	app.Spec.Command = "./main.sh"
	app.Spec.Code = []hlir.Code{
		hlir.Code{
			Name:   "main.sh",
			Source: main,
		},
	}

	app.Spec.Env = hlir.Env{}
	for key, value := range s3.Spec.Env {
		app.Spec.Env[key] = value
	}

	envPrefix := "__LUNCHPAIL_S3_ORIGIN_"
	app.Spec.Datasets = []hlir.Dataset{
		hlir.Dataset{
			Name: "origin",
			S3: hlir.S3{
				Secret:    s3.Spec.Secret,
				EnvPrefix: envPrefix,
			},
		},
	}

	app.Spec.Env["__LUNCHPAIL_PROCESS_S3_OBJECTS_ENDPOINT_VAR"] = envPrefix + "endpoint"
	app.Spec.Env["__LUNCHPAIL_PROCESS_S3_OBJECTS_ACCESS_KEY_VAR"] = envPrefix + "accessKeyID"
	app.Spec.Env["__LUNCHPAIL_PROCESS_S3_OBJECTS_SECRET_KEY_VAR"] = envPrefix + "secretAccessKey"

	app.Spec.Env["__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH"] = s3.Spec.Path

	if s3.Spec.Repeat > 0 {
		app.Spec.Env["__LUNCHPAIL_PROCESS_S3_OBJECTS_REPEAT"] = strconv.Itoa(s3.Spec.Repeat)
	}

	return app, nil
}
