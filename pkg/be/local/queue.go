package local

import (
	"context"
	"encoding/json"
	"os"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, err = backend.Queue(ctx, run)
	stop = func() {}
	return
}

func (backend Backend) Queue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, err error) {
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

	b, err := os.ReadFile(f)
	if err != nil {
		return spec, err
	}

	if err := json.Unmarshal(b, &spec); err != nil {
		return spec, err
	}

	return spec, nil
}
