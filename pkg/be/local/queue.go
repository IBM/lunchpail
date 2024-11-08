package local

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"time"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext, opts build.LogOptions) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, err = backend.queue(ctx, run)
	stop = func() {}
	return
}

func (backend Backend) queue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, err error) {
	spec, rerr := restoreContext(run)
	if rerr != nil {
		err = rerr
		return
	}

	// TODO this is hard-wired to local minio
	endpoint = spec.Queue.Endpoint
	accessKeyID = spec.Queue.AccessKey
	secretAccessKey = spec.Queue.SecretKey
	bucket = spec.Queue.Bucket
	return
}

func saveContext(ir llir.LLIR) error {
	f, err := files.QueueFile(ir.Context.Run)
	if err != nil {
		return err
	}

	b, err := json.Marshal(ir.Context)
	if err != nil {
		return err
	}

	return os.WriteFile(f, b, 0644)
}

func restoreContext(run queue.RunContext) (llir.Context, error) {
	var spec llir.Context

	f, err := files.QueueFile(run)
	if err != nil {
		return spec, err
	}

	var b []byte
	for len(b) == 0 {
		if b, err = os.ReadFile(f); err != nil {
			if !errors.Is(err, os.ErrNotExist) {
				return spec, err
			}
			time.Sleep(500 * time.Millisecond)
		}
	}

	if len(b) > 0 {
		if err := json.Unmarshal(b, &spec); err != nil {
			return spec, err
		}
	}

	return spec, nil
}
