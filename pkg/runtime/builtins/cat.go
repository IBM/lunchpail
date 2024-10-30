package builtins

import (
	"context"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func Cat(ctx context.Context, client s3.S3Client, run queue.RunContext, inputs []string, opts build.LogOptions) error {
	qopts := s3.AddOptions{
		S3Client:   client,
		LogOptions: opts,
	}
	if err := s3.AddList(ctx, run, inputs, qopts); err != nil {
		return err
	}

	if err := s3.QdoneClient(ctx, client, run, opts); err != nil {
		return err
	}

	return nil
}

func CatClient(ctx context.Context, backend be.Backend, run queue.RunContext, inputs []string, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run.RunName)
	if err != nil {
		return err
	}
	defer client.Stop()

	return Cat(ctx, client.S3Client, run, inputs, opts)
}

func CatApp() hlir.HLIR {
	app := hlir.NewApplication("cat")
	app.Spec.Role = "worker"
	app.Spec.Command = "./main.sh"
	app.Spec.Image = "docker.io/alpine:3"
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: `#!/bin/sh
mv $1 $2`},
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
		WorkerPools:  []hlir.WorkerPool{hlir.NewPool("default", 1)},
	}
}
