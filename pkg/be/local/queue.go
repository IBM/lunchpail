package local

import (
	"context"
	"encoding/json"
	"os"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/llir"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, prefixPath, err = backend.Queue(ctx, runname)
	stop = func() {}
	return
}

func (backend Backend) Queue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, err error) {
	spec, rerr := restoreQueue(runname)
	if rerr != nil {
		err = rerr
		return
	}

	// TODO this is hard-wired to local minio
	endpoint = spec.Endpoint
	accessKeyID = spec.AccessKey
	secretAccessKey = spec.SecretKey
	bucket = spec.Bucket
	prefixPath = api.QueuePrefixPath(spec, runname)
	return
}

func saveQueue(ir llir.LLIR) error {
	f, err := files.QueueFile(ir.RunName)
	if err != nil {
		return err
	}

	b, err := json.Marshal(ir.Queue)
	if err != nil {
		return err
	}

	return os.WriteFile(f, b, 0644)
}

func restoreQueue(runname string) (llir.Queue, error) {
	var spec llir.Queue

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
