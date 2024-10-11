package builtins

import (
	"context"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/runtime/queue"
)

func Cat(ctx context.Context, client queue.S3Client, inputs []string, opts build.LogOptions) error {
	qopts := queue.AddOptions{
		S3Client:   client,
		LogOptions: opts,
	}
	if err := queue.AddList(ctx, inputs, qopts); err != nil {
		return err
	}

	if err := queue.QdoneClient(ctx, client, opts); err != nil {
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

	return Cat(ctx, client.S3Client, inputs, opts)
}
