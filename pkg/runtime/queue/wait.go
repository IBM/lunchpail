package queue

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"

	"lunchpail.io/pkg/ir/queue"
)

func (s3 S3Client) waitForBucket(bucket string) error {
	// TODO use notifications
	for {
		exists, err := s3.BucketExists(bucket)
		if err != nil {
			return err
		} else if !exists {
			fmt.Fprintf(os.Stderr, "Waiting for bucket %s\n", bucket)
			time.Sleep(1 * time.Second)
		} else {
			break
		}
	}

	return nil
}

func (s3 S3Client) WaitTillExists(bucket, object string) error {
	objs, errs := s3.Listen(bucket, object, "", false)
	for {
		select {
		case err := <-errs:
			fmt.Fprintf(os.Stderr, "s3.WaitTillExists falling back on polling due to listen error: %v\n", err)
			return s3.waitTillExistsViaPolling(bucket, object, false)
		case <-objs:
			return nil
		}
	}
}

func (s3 S3Client) Listen(bucket, prefix, suffix string, includeDeletions bool) (<-chan string, <-chan error) {
	c := make(chan string)
	e := make(chan error)

	watcherIsAlive := false
	greported := make(map[string]bool)
	reportCreate := func(key string, reported map[string]bool) {
		if !reported[key] && !greported[key] {
			reported[key] = true
			c <- key
		}
	}
	reportDelete := func(key string) {
		delete(greported, key)
		c <- key
	}
	dead := false
	var mu sync.Mutex
	once := func() {
		mu.Lock()
		defer mu.Unlock()
		myreported := make(map[string]bool)
		for o := range s3.client.ListObjects(s3.context, bucket, minio.ListObjectsOptions{Prefix: prefix, Recursive: true}) {
			select {
			case <-s3.context.Done():
				return
			default:
				if dead {
					return
				} else if o.Err != nil {
					e <- o.Err
				} else {
					reportCreate(o.Key, myreported)
				}
			}
		}

		if includeDeletions {
			for k := range greported {
				if !myreported[k] {
					reportDelete(k)
				}
			}
		}
		greported = myreported
	}

	// minio push notifications are ... buggy. plus, even if they
	// were reliable, we would still need to do a full ListObjects
	// in advance and after the first push notification (these are
	// the two time windows that ListenBucketNotification would
	// miss; i.e. the interval between now and when our
	// ListenBucketNotification is registered with the minio
	// server)
	go func() {
		for !dead {
			select {
			case <-s3.context.Done():
				return
			default:
			}

			once()

			interval := 5 * time.Second
			if !watcherIsAlive {
				interval = 500 * time.Millisecond
			}
			time.Sleep(interval)
		}
	}()

	go func() {
		defer func() {
			dead = true
			close(c)
			close(e)
		}()
		already := false

		events := []string{"s3:ObjectCreated:*"}
		if includeDeletions {
			events = append(events, "s3:ObjectRemoved:*")
		}

		for n := range s3.client.ListenBucketNotification(s3.context, bucket, prefix, suffix, events) {
			if n.Err != nil {
				e <- n.Err
				continue
			}
			watcherIsAlive = true

			if !already {
				already = true
				once()
			}
			mu.Lock()
			for _, r := range n.Records {
				if !includeDeletions || strings.HasPrefix(r.EventName, "s3:ObjectCreated:") {
					reportCreate(r.S3.Object.Key, greported)
				} else {
					reportDelete(r.S3.Object.Key)
				}
			}
			mu.Unlock()
		}

		// in case the Listen itself fails, avoid once() sending on a closed channel
		watcherIsAlive = true
	}()

	return c, e
}

func (s3 S3Client) StopListening(bucket string) error {
	return s3.client.RemoveAllBucketNotification(s3.context, bucket)
}

// Wait for the given enqueued task to appear in the outbox
func (c S3Client) WaitForCompletion(run queue.RunContext, task string, verbose bool) (int, error) {
	run = run.ForTask(task)
	codesDir := run.AsFileForAnyWorker(queue.FinishedWithCode)

	if verbose {
		fmt.Fprintf(os.Stderr, "Waiting for task completion %s -> %s\n", task, codesDir)
	}

	defer c.StopListening(run.Bucket)
	objs, errs := c.Listen(run.Bucket, codesDir, "", false)
	for {
		select {
		case err := <-errs:
			if verbose {
				fmt.Fprintln(os.Stderr, err)
			}
			time.Sleep(3 * time.Second)

		case obj := <-objs:
			if filepath.Base(obj) == task {
				if verbose {
					fmt.Fprintf(os.Stderr, "Task completed %s\n", task)
				}

				if code, err := c.Get(run.Bucket, obj); err != nil {
					return 0, err
				} else {
					if verbose {
						fmt.Fprintf(os.Stderr, "Task completed %s with return code %s\n", task, code)
					}

					exitcode, err := strconv.Atoi(code)
					if err != nil {
						return 0, err
					}
					return exitcode, nil
				}
			}
		}
	}
}

func (c S3Client) waitTillExistsViaPolling(bucket, prefix string, verbose bool) error {
	task := filepath.Base(prefix)

	for {
		doneTasks, err := c.Lsf(bucket, prefix)
		if err != nil {
			return err
		}

		if len(doneTasks) > 0 {
			break
		} else {
			if verbose {
				fmt.Fprintf(os.Stderr, "Still waiting for task completion %s. Here is what is done so far: %v\n", task, doneTasks)
			}
			time.Sleep(3 * time.Second)
		}
	}

	return nil
}
