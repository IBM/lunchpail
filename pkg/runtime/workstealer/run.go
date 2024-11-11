package workstealer

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/bep/debounce"
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/observe/queuestreamer"
	s3 "lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

type Options struct {
	// If we need to resort to polling of S3, this is the polling interval we will use
	PollingInterval int

	// Automatically tear down the run when all output has been consumed?
	SelfDestruct bool

	build.LogOptions
}

type client struct {
	s3 s3.S3Client
	queue.RunContext
	pathPatterns queuestreamer.PathPatterns
	build.LogOptions
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context, run queue.RunContext, opts Options) error {
	s3, err := s3.NewS3Client(ctx)
	if err != nil {
		return err
	}

	group, gctx := errgroup.WithContext(ctx)

	// Set up a streamer of Models to modelChan. We will tell the
	// streamer when we want it to terminate via doneChan.
	modelChan := make(chan queuestreamer.Model)
	doneChan := make(chan struct{})
	defer close(doneChan)
	group.Go(func() error {
		defer close(modelChan)

		err := queuestreamer.StreamModel(gctx, s3, run, modelChan, doneChan, queuestreamer.StreamOptions{LogOptions: opts.LogOptions, PollingInterval: opts.PollingInterval, AnyStep: true})
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Workstealer queue streamer has exited err=%v\n", err)
		}
		return err
	})

	c := client{s3, run, queuestreamer.NewPathPatterns(run), opts.LogOptions}
	fmt.Fprintln(os.Stderr, "Workstealer starting")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Run: %v\n", run)
		// fmt.Fprintf(os.Stderr, "PathPatterns: %v\n", c.pathPatterns.outboxTask.String())
		printenv()
	}

	// There is no need to respond to every single update, as long
	// as we respond to updates eventually... This will reduce
	// chatter to S3.
	debounced := debounce.New(100 * time.Millisecond)

	for model := range modelChan {
		debounced(func() {
			if readyToBye(model) {
				fmt.Fprintln(os.Stderr, "All work for this run has been completed, all workers have terminated")
				// notify the streamer we are done
				if opts.Verbose {
					fmt.Fprintln(os.Stderr, "Workstealer assessor has initiated a shutdown")
				}
				select {
				case doneChan <- struct{}{}:
				default:
				}

				return
			}

			for _, m := range model.Steps {
				if err := c.report(m); err != nil {
					fmt.Fprintln(os.Stderr, "Error logging model", err)
				}

				// Assess the model to determine new work assignments, etc.
				c.assess(model, m)
			}
		})
	}

	// Drop a final breadcrumb indicating we are ready to tear
	// down all associated resources
	if opts.SelfDestruct {
		fmt.Fprintf(os.Stderr, "Instructing the run to self-destruct bucket=%s file=%s\n", c.RunContext.Bucket, c.RunContext.AsFile(queue.AllDoneMarker))
		if err := s3.Touch(c.RunContext.Bucket, c.RunContext.AsFile(queue.AllDoneMarker)); err != nil {
			fmt.Fprintf(os.Stderr, "Unable to touch AllDone file\n%v\n", err)
		}
	} else if opts.Verbose {
		fmt.Fprintln(os.Stderr, "*Not* instructing the run to self-destruct")
	}

	util.SleepBeforeExit()
	fmt.Fprintln(os.Stderr, "This run should be all done now")

	return group.Wait()
}
