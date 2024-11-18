package worker

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func startWatch(ctx context.Context, handler []string, client s3.S3Client, opts Options) error {
	if opts.LogOptions.Verbose {
		defer func() {
			fmt.Fprintf(os.Stderr, "Worker exiting step=%d pool=%s worker=%s\n", opts.RunContext.Step, opts.RunContext.PoolName, opts.RunContext.WorkerName)
		}()
	}

	// In case workers need to coordinate, we offer them a lock file that they can fcntl.Lock
	lockfile, err := ioutil.TempFile("", "lunchpail-lock")
	if err != nil {
		return err
	}
	defer os.Remove(lockfile.Name())

	if err := client.Mkdirp(opts.RunContext.Bucket); err != nil {
		return err
	}

	alive := opts.RunContext.AsFile(queue.WorkerAliveMarker)
	if opts.LogOptions.Debug {
		fmt.Fprintf(os.Stderr, "Touching alive file bucket=%s path=%s\n", opts.RunContext.Bucket, alive)
	}
	if err := client.Touch(opts.RunContext.Bucket, alive); err != nil {
		return err
	}

	localdir, err := os.MkdirTemp("", "lunchpail_local_queue_")
	if err != nil {
		return err
	}

	killFile := opts.RunContext.AsFile(queue.WorkerKillFile)
	inboxPrefix := opts.RunContext.AsFile(queue.AssignedAndPending)
	if opts.LogOptions.Debug {
		fmt.Fprintf(os.Stderr, "Listening bucket=%s inboxPrefix=%s killFile=%s\n", opts.RunContext.Bucket, inboxPrefix, killFile)
	}

	// Future readers: adjust SetLimit to allow "pod packing",
	// i.e. concurrent processing of tasks in a single Lunchpail
	// worker (see #25)
	group, gctx := errgroup.WithContext(ctx)
	pack := opts.Pack
	if pack == 0 {
		// see cmd/main.go on how this will be responsive to cgroup limits
		pack = runtime.GOMAXPROCS(0)
	}
	group.SetLimit(pack)

	// Wait for a kill file and then cancel the watcher (that runs in the for{} loop below)
	cancellable, cancel := context.WithCancel(gctx)
	go func() {
		client.WaitTillExists(opts.RunContext.Bucket, killFile)
		if opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Worker got kill file step=%d pool=%s worker=%s. Cleaning up...", opts.RunContext.Step, opts.RunContext.PoolName, opts.RunContext.WorkerName)
		}
		cancel()
	}()

	s := opts.PollingInterval
	if s == 0 {
		s = 3
	}

	backgroundS3Tasks, _ := errgroup.WithContext(ctx)
	p := taskProcessor{ctx, client, handler, localdir, opts, lockfile.Name(), backgroundS3Tasks}

	sleepNextTime := false
	tasks, errs := client.Listen(opts.RunContext.Bucket, inboxPrefix, "", false)
	done := false
	for !done {
		if sleepNextTime {
			time.Sleep(time.Duration(s) * time.Second)
		}

		select {
		case err := <-errs:
			if err != nil && !errors.Is(err, s3.ListenNotSupportedError) {
				if opts.LogOptions.Verbose {
					fmt.Fprintln(os.Stderr, err)
				}
				sleepNextTime = true
			}

		case task := <-tasks:
			if task != "" {
				if opts.LogOptions.Debug {
					fmt.Fprintf(os.Stderr, "Got push notification of task %s\n", filepath.Base(task))
				}
				// we got a push notification, handle it here, and continue to the next for{} select
				group.Go(func() error { return p.process(task) })
			}
			continue

		case <-cancellable.Done():
			done = true
			continue
		}

		// If we fall through here, it is probably because the S3 queue does not support push notifications
		if opts.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Listing unassigned tasks bucket=%s inboxPrefix=%s\n", opts.RunContext.Bucket, inboxPrefix)
		}
		tasks, err := client.Lsf(opts.RunContext.Bucket, inboxPrefix)
		if err != nil {
			return err
		}
		for _, task := range tasks {
			group.Go(func() error { return p.process(task) })
		}
	}

	if err := group.Wait(); err != nil {
		return err
	}

	if err := backgroundS3Tasks.Wait(); err != nil {
		return err
	}

	return nil
}
