package workstealer

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

func EnqueueFile(task string) error {
	s3, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{s3, pathsForRun()}

	if err := c.s3.Mkdirp(c.paths.bucket); err != nil {
		return err
	}

	return c.s3.upload(c.paths.bucket, task, filepath.Join(c.paths.poolPrefix, c.paths.inbox, filepath.Base(task)))
}

func EnqueueFromS3(fullpath, endpoint, accessKeyId, secretAccessKey string, repeat int) error {
	fmt.Fprintf(os.Stderr, "Enqueue from s3 fullpath=%s endpoint=%s repeat=%d\n", fullpath, endpoint, repeat)

	queue, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{queue, pathsForRun()}

	if err := queue.Mkdirp(c.paths.bucket); err != nil {
		return err
	}

	fullpathSplit := strings.Split(fullpath, "/")
	bucket := fullpathSplit[0]
	path := ""
	if len(fullpathSplit) > 1 {
		path = filepath.Join(fullpathSplit[1:]...)
	}

	group, _ := errgroup.WithContext(context.Background())

	origin, err := newS3ClientFromOptions(S3ClientOptions{endpoint, accessKeyId, secretAccessKey})
	if err != nil {
		return err
	}

	for {
		if exists, err := origin.BucketExists(bucket); err != nil {
			return err
		} else if exists {
			break
		} else {
			fmt.Fprintf(os.Stderr, "Waiting for source bucket to exist: %s\n", bucket)
			time.Sleep(1 * time.Second)
		}
	}

	srcBucket := bucket
	dstBucket := c.paths.bucket
	inbox := filepath.Join(c.paths.poolPrefix, c.paths.inbox)

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
				fmt.Fprintf(os.Stderr, "Enqueue task from s3 srcBucket=%s src=%s dstBucket=%s dst=%s\n", srcBucket, src, dstBucket, dst)

				return origin.CopyToRemote(queue, srcBucket, src, dstBucket, dst)
			})
		}
	}

	err = group.Wait()

	fmt.Printf("Here is what we enqueued to %s:\n", inbox)
	for o := range queue.ListObjects(dstBucket, inbox, true) {
		fmt.Println(o.Key)
	}

	if err != nil {
		return fmt.Errorf("Error enqueueing from s3: %v", err)
	}

	return nil
}
