package local

import (
	"context"
	"encoding/json"
	"os"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/ir/llir"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, err = backend.Queue(ctx, runname)
	stop = func() {}
	return
}

func (backend Backend) Queue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket string, err error) {
	spec, rerr := restoreContext(runname)
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
	f, err := files.QueueFile(ir.RunName())
	if err != nil {
		return err
	}

	b, err := json.Marshal(ir.Context)
	if err != nil {
		return err
	}

	return os.WriteFile(f, b, 0644)
}

func restoreContext(runname string) (llir.Context, error) {
	var spec llir.Context

	f, err := files.QueueFile(runname)
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
