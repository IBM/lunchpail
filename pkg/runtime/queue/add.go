package queue

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
)

type AddOptions struct {
	build.LogOptions
	S3Client

	// Wait for the enqueued task to be completed
	Wait bool

	// If uploading from a named pipe, use this as the file name
	AsIfNamedPipe string
}

type AddS3Options struct {
	build.LogOptions
}

// Enqueue a given `task` file
func Add(ctx context.Context, runname string, task string, opts AddOptions) (code int, err error) {
	c := opts.S3Client

	if c.client == nil {
		// Then we try to pull the client config from environment variables
		c, err = NewS3Client(ctx)
		if err != nil {
			return
		}
	}

	args := api.PathArgs{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	inbox := args.TemplateP(api.Unassigned)

	err = c.Mkdirp(args.Bucket)
	if err != nil {
		return
	}

	if opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Enqueuing task %s\n", task)
	}

	err = c.UploadAs(args.Bucket, task, filepath.Join(inbox, filepath.Base(task)), opts.AsIfNamedPipe)
	if err != nil {
		return
	}

	if opts.Wait {
		return c.WaitForCompletion(runname, filepath.Base(task), opts.Verbose)
	}

	return
}

// Enqueue a list of given files
func AddList(ctx context.Context, runname string, inputs []string, opts AddOptions) error {
	if len(inputs) == 0 {
		return nil
	}

	group, gctx := errgroup.WithContext(ctx)
	for idx, input := range inputs {
		group.Go(func() error {
			opts.AsIfNamedPipe = fmt.Sprintf("task.%d.txt", idx+1)
			if _, err := Add(gctx, runname, input, opts); err != nil {
				return err
			}
			return nil
		})
	}

	return group.Wait()
}

// Enqueue tasks from a path in an s3 bucket
func AddFromS3(ctx context.Context, runname, fullpath, endpoint, accessKeyId, secretAccessKey string, repeat int, opts AddS3Options) error {
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

	args := api.PathArgs{Bucket: dstBucket, RunName: runname, Step: 0} // FIXME
	inbox := args.TemplateP(api.Unassigned)

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
		return fmt.Errorf("Error enqueuing from s3: %v", err)
	}

	return nil
}
