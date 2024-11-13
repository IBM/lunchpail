package qstat

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/observe/queuestreamer"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func stream(ctx context.Context, runnameIn string, backend be.Backend, opts Options) (queue.RunContext, chan queuestreamer.Model, chan struct{}, *errgroup.Group, error) {
	runname, err := util.WaitForRun(ctx, runnameIn, true, backend)
	if err != nil {
		return queue.RunContext{}, nil, nil, nil, err
	}

	if opts.Verbose {
		fmt.Fprintln(os.Stderr, "Tracking run", runname)
	}

	client, err := s3.NewS3ClientForRun(ctx, backend, queue.RunContext{RunName: runname, Step: opts.Step}, queue.Spec{}, opts.LogOptions)
	if err != nil {
		return client.RunContext, nil, nil, nil, err
	}

	group, gctx := errgroup.WithContext(ctx)

	// Set up a streamer of Models to modelChan. We will tell the
	// streamer when we want it to terminate via doneChan.
	modelChan := make(chan queuestreamer.Model)
	doneChan := make(chan struct{})
	group.Go(func() error {
		defer close(modelChan)
		defer client.Stop()

		opts.StreamOptions.AnyStep = true
		return queuestreamer.StreamModel(gctx, client.S3Client, client.RunContext, modelChan, doneChan, opts.StreamOptions)
	})

	return client.RunContext, modelChan, doneChan, group, nil
}
