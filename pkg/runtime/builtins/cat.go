package builtins

import (
	"context"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/runtime/queue"
)

func Cat(ctx context.Context, client queue.S3Client, runname string, inputs []string, opts build.LogOptions) error {
	qopts := queue.AddOptions{
		S3Client:   client,
		LogOptions: opts,
	}
	if err := queue.AddList(ctx, runname, inputs, qopts); err != nil {
		return err
	}

	if err := queue.QdoneClient(ctx, client, runname, opts); err != nil {
		return err
	}

	return nil
}

func CatClient(ctx context.Context, backend be.Backend, runname string, inputs []string, opts build.LogOptions) error {
	client, err := queue.NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer client.Stop()

	return Cat(ctx, client.S3Client, runname, inputs, opts)
}

func CatApp() hlir.HLIR {
	app := hlir.NewApplication("cat")
	app.Spec.Role = "worker"
	app.Spec.Command = "/bin/sh -c ./main.sh"
	app.Spec.Image = "docker.io/alpine:3"
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: "echo hi"},
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
		WorkerPools:  []hlir.WorkerPool{hlir.NewPool("cat", 1)},
	}
}
