package queue

// TODO once we incorporate the workstealer into the top-level pkg, we
// can share this with the runtime/worker/s3.go

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
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

func (s3 S3Client) Lsf(bucket, prefix string) ([]string, error) {
	objectCh := s3.client.ListObjects(context.Background(), bucket, minio.ListObjectsOptions{
		Prefix:    prefix + "/",
		Recursive: false,
	})

	tasks := []string{}
	for object := range objectCh {
		if object.Err != nil {
			return tasks, object.Err
		}

		task := filepath.Base(object.Key)
		if task != ".alive" {
			tasks = append(tasks, task)
		}
	}

	return tasks, nil
}

func (s3 S3Client) Exists(bucket, prefix, file string) bool {
	if _, err := s3.client.StatObject(context.Background(), bucket, filepath.Join(prefix, file), minio.StatObjectOptions{}); err == nil {
		return true
	} else {
		return false
	}
}

func (s3 S3Client) Copyto(sourceBucket, source, destBucket, dest string) error {
	src := minio.CopySrcOptions{
		Bucket: sourceBucket,
		Object: source,
	}

	dst := minio.CopyDestOptions{
		Bucket: destBucket,
		Object: dest,
	}

	_, err := s3.client.CopyObject(context.Background(), dst, src)
	return err
}

func (origin S3Client) CopyToRemote(remote S3Client, sourceBucket, source, destBucket, dest string) error {
	if origin.endpoint == remote.endpoint {
		// special case...
		return origin.Copyto(sourceBucket, source, destBucket, dest)
	}

	object, err := origin.client.GetObject(context.Background(), sourceBucket, source, minio.GetObjectOptions{})
	if err != nil {
		return fmt.Errorf("Error downloading in CopyToRemote %v", err)
	}
	defer object.Close()

	// TODO on size?
	size := int64(-1)
	if _, err := remote.client.PutObject(context.Background(), destBucket, dest, object, size, minio.PutObjectOptions{}); err != nil {
		return fmt.Errorf("Error uploading in CopyToRemote %v", err)
	}

	return nil
}

func (s3 S3Client) Moveto(bucket, source, destination string) error {
	if err := s3.Copyto(bucket, source, bucket, destination); err != nil {
		return err
	}

	return s3.Rm(bucket, source)
}

func (s3 S3Client) Upload(bucket, source, destination string) error {
	for {
		_, err := s3.client.FPutObject(context.Background(), bucket, destination, source, minio.PutObjectOptions{})
		if err != nil && !s3.retryOnError(err) {
			return err
		} else if err == nil {
			break
		}
	}
	return nil
}

func (s3 S3Client) Download(bucket, source, destination string) error {
	return s3.client.FGetObject(context.Background(), bucket, source, destination, minio.GetObjectOptions{})
}

func (s3 S3Client) Touch(bucket, filePath string) error {
	r := strings.NewReader("")
	_, err := s3.client.PutObject(context.Background(), bucket, filePath, r, 0, minio.PutObjectOptions{})
	return err
}

func (s3 S3Client) Rm(bucket, filePath string) error {
	return s3.client.RemoveObject(context.Background(), bucket, filePath, minio.RemoveObjectOptions{})
}

func (s3 S3Client) Mark(bucket, filePath, marker string) error {
	_, err := s3.client.PutObject(context.Background(), bucket, filePath, strings.NewReader(marker), int64(len(marker)), minio.PutObjectOptions{})
	return err
}

func (s3 S3Client) ListObjects(bucket, filePath string, recursive bool) <-chan minio.ObjectInfo {
	return s3.client.ListObjects(context.Background(), bucket, minio.ListObjectsOptions{
		Prefix:    filePath,
		Recursive: recursive,
	})
}

func (s3 S3Client) Get(bucket, filePath string) (string, error) {
	var content bytes.Buffer
	s, err := s3.client.GetObject(context.Background(), bucket, filePath, minio.GetObjectOptions{})
	if err != nil {
		return "", err
	}
	io.Copy(io.Writer(&content), s)
	return content.String(), nil
}

func (s3 S3Client) Cat(bucket, filePath string) error {
	s, err := s3.client.GetObject(context.Background(), bucket, filePath, minio.GetObjectOptions{})
	if err != nil {
		return err
	}
	io.Copy(os.Stdout, s)
	return nil
}

func (s3 S3Client) retryOnError(err error) bool {
	if !(strings.Contains(err.Error(), "connection refused") ||
		strings.Contains(err.Error(), "i/o timeout")) {
		return false
	}

	time.Sleep(1 * time.Second)
	return true
}

func (s3 S3Client) BucketExists(bucket string) (bool, error) {
	yup := false
	for {
		exists, err := s3.client.BucketExists(context.Background(), bucket)
		if err != nil && !s3.retryOnError(err) {
			return false, err
		} else if err == nil {
			yup = exists
			break
		}

	}

	return yup, nil
}

func (s3 S3Client) Mkdirp(bucket string) error {
	exists, err := s3.BucketExists(bucket)
	if err != nil {
		return err
	}

	if !exists {
		if err := s3.client.MakeBucket(context.Background(), bucket, minio.MakeBucketOptions{}); err != nil {
			if !strings.Contains(err.Error(), "Your previous request to create the named bucket succeeded and you already own it") {
				// bucket already exists error
				return err
			}
		}
	}

	return nil
}
