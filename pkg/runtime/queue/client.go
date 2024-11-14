package queue

import (
	"context"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

type S3Client struct {
	context  context.Context
	client   *minio.Client
	endpoint string
	Paths    filepaths
	ak       string
	sk       string
}

type S3ClientStop struct {
	S3Client
	queue.RunContext
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

	return S3Client{ctx, client, opts.Endpoint, paths, opts.AccessKeyID, opts.SecretAccessKey}, nil
}

// Client for a given run in the given backend
func NewS3ClientForRun(ctx context.Context, backend be.Backend, run queue.RunContext, opts build.LogOptions) (S3ClientStop, error) {
	endpoint, accessKeyId, secretAccessKey, bucket, stop, err := backend.AccessQueue(ctx, run, opts)
	if err != nil {
		return S3ClientStop{}, err
	}

	// We might be on the client, and so need to replace a docker host ip with localhost
	if os.Getenv("LUNCHPAIL_RUN") == "" && strings.Contains(endpoint, "http://host.docker.internal") || strings.Contains(endpoint, "http://172.17.0.1") {
		words := strings.Split(endpoint, ":")
		port := "9000"
		if len(words) == 3 {
			port = words[2]
		}
		endpoint = "http://localhost:" + port
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

	run.Bucket = c.Paths.Bucket
	return S3ClientStop{c, run, stop}, nil
}
