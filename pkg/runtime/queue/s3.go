package queue

// TODO once we incorporate the workstealer into the top-level pkg, we
// can share this with the runtime/worker/s3.go

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"golang.org/x/sync/errgroup"
)

func (s3 S3Client) Lsf(bucket, prefix string) ([]string, error) {
	objectCh := s3.client.ListObjects(s3.context, bucket, minio.ListObjectsOptions{
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
	for {
		if _, err := s3.client.StatObject(s3.context, bucket, filepath.Join(prefix, file), minio.StatObjectOptions{}); err == nil {
			return true
		} else if !s3.retryOnError(err) {
			return false
		}
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

	_, err := s3.client.CopyObject(s3.context, dst, src)
	return err
}

func (origin S3Client) CopyToRemote(remote S3Client, sourceBucket, source, destBucket, dest string) error {
	if origin.endpoint == remote.endpoint {
		// special case...
		return origin.Copyto(sourceBucket, source, destBucket, dest)
	}

	object, err := origin.client.GetObject(origin.context, sourceBucket, source, minio.GetObjectOptions{})
	if err != nil {
		return fmt.Errorf("Error downloading in CopyToRemote %v", err)
	}
	defer object.Close()

	// TODO on size?
	size := int64(-1)
	if _, err := remote.client.PutObject(remote.context, destBucket, dest, object, size, minio.PutObjectOptions{}); err != nil {
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
	return s3.UploadAs(bucket, source, destination, "")
}

func (s3 S3Client) UploadAs(bucket, source, destination, asIfNamedPipe string) error {
	for {
		info, err := os.Stat(source)
		if err != nil {
			return err
		} else if info.Mode().IsRegular() {
			_, err := s3.client.FPutObject(s3.context, bucket, destination, source, minio.PutObjectOptions{})
			if err != nil && !s3.retryOnError(err) {
				return err
			} else if err == nil {
				break
			}
		} else {
			// TODO i think this doesn't work with
			// e.g. symlinks. We need a better check for
			// just named pipe.
			stream, err := os.OpenFile(source, os.O_RDONLY, os.ModeNamedPipe)
			if err != nil {
				return err
			}
			defer stream.Close()

			// We can't use the name of the fifo named
			// pipe file, as that is unpredictable and
			// fairly meaningless.
			destination = filepath.Join(filepath.Dir(destination), asIfNamedPipe)

			// Note: we have to pass -1 for size,
			// otherwise the minio client-go tries to seek
			// on the stream, which most streams don't
			// support
			if _, err := s3.client.PutObject(s3.context, bucket, destination, stream, -1, minio.PutObjectOptions{}); err != nil && !s3.retryOnError(err) {
				return err
			} else if err == nil {
				break
			}
		}
	}
	return nil
}

func (s3 S3Client) DownloadFolder(bucket, source, destination string) error {
	if err := s3.waitForBucket(bucket); err != nil {
		return err
	}

	group, ctx := errgroup.WithContext(s3.context)
	for o := range s3.ListObjects(bucket, source, true) {
		group.Go(func() error {
			if o.Err != nil {
				return o.Err
			} else if strings.HasSuffix(o.Key, "/") {
				// skip folders
				return nil
			}

			localPath := filepath.Join(destination, o.Key)
			if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
				return err
			}
			return s3.client.FGetObject(ctx, bucket, o.Key, localPath, minio.GetObjectOptions{})
		})
	}
	return group.Wait()
}

func (s3 S3Client) Download(bucket, source, destination string) error {
	return s3.client.FGetObject(s3.context, bucket, source, destination, minio.GetObjectOptions{})
}

func (s3 S3Client) Touch(bucket, filePath string) error {
	return s3.TouchP(bucket, filePath, true)
}

func (s3 S3Client) TouchP(bucket, filePath string, retry bool) error {
	r := strings.NewReader("")
	for {
		_, err := s3.client.PutObject(s3.context, bucket, filePath, r, 0, minio.PutObjectOptions{})

		if err != nil && (!retry || !s3.retryOnError(err)) {
			return err
		} else if err == nil {
			break
		}
	}
	return nil
}

func (s3 S3Client) Rm(bucket, filePath string) error {
	return s3.client.RemoveObject(s3.context, bucket, filePath, minio.RemoveObjectOptions{})
}

func (s3 S3Client) Mark(bucket, filePath, marker string) error {
	_, err := s3.client.PutObject(s3.context, bucket, filePath, strings.NewReader(marker), int64(len(marker)), minio.PutObjectOptions{})
	return err
}

func (s3 S3Client) StreamingUpload(bucket, filePath string, reader io.Reader) error {
	// Warning: without PartSize, the minio client-go allocates a ridiculously massive buffer.
	// Double Warning: if you provide PartSize < 5Mi, you get immediate failure.
	_, err := s3.client.PutObject(s3.context, bucket, filePath, reader, -1, minio.PutObjectOptions{PartSize: 5 * 1024 * 1024})
	return err
}

func (s3 S3Client) ListObjects(bucket, filePath string, recursive bool) <-chan minio.ObjectInfo {
	return s3.client.ListObjects(s3.context, bucket, minio.ListObjectsOptions{
		Prefix:    filePath,
		Recursive: recursive,
	})
}

func (s3 S3Client) Get(bucket, filePath string) (string, error) {
	var content bytes.Buffer
	s, err := s3.client.GetObject(s3.context, bucket, filePath, minio.GetObjectOptions{})
	if err != nil {
		return "", err
	}
	io.Copy(io.Writer(&content), s)
	return content.String(), nil
}

func (s3 S3Client) Cat(bucket, filePath string) error {
	s, err := s3.client.GetObject(s3.context, bucket, filePath, minio.GetObjectOptions{})
	if err != nil {
		return err
	}
	io.Copy(os.Stdout, s)
	return nil
}

// Helps with situations where the s3 server is still coming up
func (s3 S3Client) retryOnError(err error) bool {
	if !(strings.Contains(err.Error(), "connection refused") ||
		strings.Contains(err.Error(), "Server not initialized yet") ||
		strings.Contains(err.Error(), "i/o timeout")) {
		return false
	}

	time.Sleep(1 * time.Second)
	return true
}

// This will wait for the s3 server to be reachable, but will not wait
// for the bucket to exist
func (s3 S3Client) BucketExists(bucket string) (bool, error) {
	yup := false
	for {
		exists, err := s3.client.BucketExists(s3.context, bucket)
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
		if err := s3.client.MakeBucket(s3.context, bucket, minio.MakeBucketOptions{}); err != nil {
			if !strings.Contains(err.Error(), "Your previous request to create the named bucket succeeded and you already own it") {
				// bucket already exists error
				return err
			}
		}
	}

	return nil
}
