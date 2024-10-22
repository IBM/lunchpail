package queue

import (
	"context"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/ir/queue"
)

type S3Client struct {
	context  context.Context
	client   *minio.Client
	endpoint string
	Paths    filepaths
}

type S3ClientStop struct {
	S3Client
	Stop func()
}

// Initialize minio client object
func NewS3Client(ctx context.Context) (S3Client, error) {
	endpoint := os.Getenv("lunchpail_queue_endpoint")
	accessKeyID := os.Getenv("lunchpail_queue_accessKeyID")
	secretAccessKey := os.Getenv("lunchpail_queue_secretAccessKey")

	return NewS3ClientFromOptions(ctx, S3ClientOptions{endpoint, accessKeyID, secretAccessKey})
}

type S3ClientOptions struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
}

// Initialize minio client object from options
func NewS3ClientFromOptions(ctx context.Context, opts S3ClientOptions) (S3Client, error) {
	useSSL := true
	if !strings.HasPrefix(opts.Endpoint, "https") {
		useSSL = false
	}

	opts.Endpoint = strings.Replace(opts.Endpoint, "https://", "", 1)
	opts.Endpoint = strings.Replace(opts.Endpoint, "http://", "", 1)

	client, err := minio.New(opts.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(opts.AccessKeyID, opts.SecretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return S3Client{}, err
	}

	paths, err := pathsForRun()
	if err != nil {
		return S3Client{}, err
	}

	return S3Client{ctx, client, opts.Endpoint, paths}, nil
}

// Client for a given run in the given backend
func NewS3ClientForRun(ctx context.Context, backend be.Backend, runname string) (S3ClientStop, error) {
	if runname == "" {
		run, err := util.Singleton(ctx, backend)
		if err != nil {
			return S3ClientStop{}, err
		}
		runname = run.Name
	}

	endpoint, accessKeyId, secretAccessKey, bucket, stop, err := backend.AccessQueue(ctx, queue.RunContext{RunName: runname})
	if err != nil {
		return S3ClientStop{}, err
	}

	c, err := NewS3ClientFromOptions(ctx, S3ClientOptions{Endpoint: endpoint, AccessKeyID: accessKeyId, SecretAccessKey: secretAccessKey})
	if err != nil {
		return S3ClientStop{}, err
	}

	if paths, err := pathsFor(bucket); err != nil {
		return S3ClientStop{}, err
	} else {
		c.Paths = paths
	}

	return S3ClientStop{c, stop}, nil
}
