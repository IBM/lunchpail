package queue

import (
	"context"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
)

type S3Client struct {
	client   *minio.Client
	endpoint string
	Paths    filepaths
}

// Initialize minio client object
func NewS3Client() (S3Client, error) {
	endpoint := os.Getenv("lunchpail_queue_endpoint")
	accessKeyID := os.Getenv("lunchpail_queue_accessKeyID")
	secretAccessKey := os.Getenv("lunchpail_queue_secretAccessKey")

	return NewS3ClientFromOptions(S3ClientOptions{endpoint, accessKeyID, secretAccessKey})
}

type S3ClientOptions struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
}

// Initialize minio client object from options
func NewS3ClientFromOptions(opts S3ClientOptions) (S3Client, error) {
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

	return S3Client{client, opts.Endpoint, paths}, nil
}

// Client for a given run in the given backend
func NewS3ClientForRun(ctx context.Context, backend be.Backend, runname string) (S3Client, func(), error) {
	if runname == "" {
		run, err := util.Singleton(backend)
		if err != nil {
			return S3Client{}, nil, err
		}
		runname = run.Name
	}

	endpoint, accessKeyId, secretAccessKey, bucket, prefixPath, stop, err := backend.AccessQueue(ctx, runname)
	if err != nil {
		return S3Client{}, nil, err
	}

	c, err := NewS3ClientFromOptions(S3ClientOptions{Endpoint: endpoint, AccessKeyID: accessKeyId, SecretAccessKey: secretAccessKey})
	if err != nil {
		return S3Client{}, nil, err
	}

	c.Paths.Bucket = bucket
	c.Paths.Prefix = strings.Replace(prefixPath, bucket+"/", "", 1)
	return c, stop, nil
}
