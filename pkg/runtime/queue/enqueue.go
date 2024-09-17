package queue

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

type EnqueueFileOptions struct {
	// Wait for the enqueued task to be completed
	Wait bool

	// Verbose output
	Verbose bool

	// Debug output
	Debug bool
}

type EnqueueS3Options struct {
	// Verbose output
	Verbose bool

	// Debug output
	Debug bool
}

func EnqueueFile(ctx context.Context, task string, opts EnqueueFileOptions) (int, error) {
	c, err := NewS3Client(ctx)
	if err != nil {
		return 0, err
	}

	if err := c.Mkdirp(c.Paths.Bucket); err != nil {
		return 0, err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Enqueuing task %s\n", task)
	}

	if err := c.Upload(c.Paths.Bucket, task, filepath.Join(c.Paths.PoolPrefix, c.Paths.Inbox, filepath.Base(task))); err != nil {
		return 0, err
	}

	if opts.Wait {
		return c.WaitForCompletion(filepath.Base(task), opts.Verbose)
	}

	return 0, nil
}

func EnqueueFromS3(ctx context.Context, fullpath, endpoint, accessKeyId, secretAccessKey string, repeat int, opts EnqueueS3Options) error {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Enqueue from s3 fullpath=%s endpoint=%s repeat=%d\n", fullpath, endpoint, repeat)
	}

	queue, err := NewS3Client(ctx)
	if err != nil {
		return err
	}

	if err := queue.Mkdirp(queue.Paths.Bucket); err != nil {
		return err
	}

	fullpathSplit := strings.Split(fullpath, "/")
	bucket := fullpathSplit[0]
	path := ""
	if len(fullpathSplit) > 1 {
		path = filepath.Join(fullpathSplit[1:]...)
	}

	group, gctx := errgroup.WithContext(ctx)

	origin, err := NewS3ClientFromOptions(gctx, S3ClientOptions{endpoint, accessKeyId, secretAccessKey})
	if err != nil {
		return err
	}

	for {
		if exists, err := origin.BucketExists(bucket); err != nil {
			return err
		} else if exists {
			break
		} else {
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Waiting for source bucket to exist: %s\n", bucket)
			}
			time.Sleep(1 * time.Second)
		}
	}

	srcBucket := bucket
	dstBucket := queue.Paths.Bucket
	inbox := filepath.Join(queue.Paths.PoolPrefix, queue.Paths.Inbox)

	for o := range origin.ListObjects(bucket, path, true) {
		if o.Err != nil {
			return o.Err
		}

		src := o.Key
		ext := filepath.Ext(src)
		withoutExt := src[0 : len(src)-len(ext)]

		for idx := range repeat {
			group.Go(func() error {
				task := fmt.Sprintf("%s.%d%s", withoutExt, idx+1, ext) // Note: idx+1 to have 1-indexed
				dst := filepath.Join(inbox, filepath.Base(task))
				if opts.Verbose {
					fmt.Fprintf(os.Stderr, "Enqueue task from s3 srcBucket=%s src=%s dstBucket=%s dst=%s\n", srcBucket, src, dstBucket, dst)
				}
				return origin.CopyToRemote(queue, srcBucket, src, dstBucket, dst)
			})
		}
	}

	err = group.Wait()

	if opts.Verbose {
		fmt.Printf("Here is what we enqueued to %s:\n", inbox)
	}
	for o := range queue.ListObjects(dstBucket, inbox, true) {
		fmt.Println(o.Key)
	}

	if err != nil {
		return fmt.Errorf("Error enqueueing from s3: %v", err)
	}

	return nil
}
