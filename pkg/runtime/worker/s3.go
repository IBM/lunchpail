package worker

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3Client struct {
	client *minio.Client
}

// Initialize minio client object.
func newS3Client() (S3Client, error) {
	endpoint := os.Getenv("lunchpail_queue_endpoint")
	accessKeyID := os.Getenv("lunchpail_queue_accessKeyID")
	secretAccessKey := os.Getenv("lunchpail_queue_secretAccessKey")

	useSSL := true
	if !strings.HasPrefix(endpoint, "https") {
		useSSL = false
	}

	endpoint = strings.Replace(endpoint, "https://", "", 1)
	endpoint = strings.Replace(endpoint, "http://", "", 1)

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})

	return S3Client{client}, err
}

func (client *S3Client) lsf(bucket, prefix string) ([]string, error) {
	objectCh := client.client.ListObjects(context.Background(), bucket, minio.ListObjectsOptions{
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

func (client *S3Client) exists(bucket, prefix, file string) bool {
	if _, err := client.client.StatObject(context.Background(), bucket, filepath.Join(prefix, file), minio.StatObjectOptions{}); err == nil {
		return true
	} else {
		return false
	}
}

func (client *S3Client) copyto(bucket, source, destination string) error {
	src := minio.CopySrcOptions{
		Bucket: bucket,
		Object: source,
	}

	dst := minio.CopyDestOptions{
		Bucket: bucket,
		Object: destination,
	}

	_, err := client.client.CopyObject(context.Background(), dst, src)
	return err
}

func (client *S3Client) moveto(bucket, source, destination string) error {
	if err := client.copyto(bucket, source, destination); err != nil {
		return err
	}

	return client.rm(bucket, source)
}

func (client *S3Client) upload(bucket, source, destination string) error {
	_, err := client.client.FPutObject(context.Background(), bucket, destination, source, minio.PutObjectOptions{})
	return err
}

func (client *S3Client) download(bucket, source, destination string) error {
	return client.client.FGetObject(context.Background(), bucket, source, destination, minio.GetObjectOptions{})
}

func (client *S3Client) touch(bucket, filePath string) error {
	r := strings.NewReader("")
	_, err := client.client.PutObject(context.Background(), bucket, filePath, r, 0, minio.PutObjectOptions{})
	return err
}

func (client *S3Client) rm(bucket, filePath string) error {
	return client.client.RemoveObject(context.Background(), bucket, filePath, minio.RemoveObjectOptions{})
}
