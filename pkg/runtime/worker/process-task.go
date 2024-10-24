package worker

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

type taskProcessor struct {
	ctx               context.Context
	client            s3.S3Client
	handler           []string
	localdir          string
	opts              Options
	backgroundS3Tasks *errgroup.Group
}

// Process one task by invoking the given `handler` command line on
// the given `task` (stored in S3, in the inbox for this worker)
func (p taskProcessor) process(task string) error {
	task = filepath.Base(task)
	if p.opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Worker starting task %s\n", task)
	}

	taskContext := p.opts.RunContext.ForTask(task)
	in := taskContext.AsFile(queue.AssignedAndPending)
	inprogress := taskContext.AsFile(queue.AssignedAndProcessing)

	// TODO: support multiple outputs from the handler. #398
	localoutbox := filepath.Join(p.localdir, "outbox", task)
	err := os.MkdirAll(filepath.Dir(localoutbox), os.ModePerm)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Internal Error creating local outbox:", err)
		return nil
	}

	// Download task
	localprocessing := filepath.Join(p.localdir, task)
	err = p.client.Download(taskContext.Bucket, in, localprocessing)
	if err != nil {
		if !strings.Contains(err.Error(), "key does not exist") {
			// we ignore "key does not exist" errors, as these result from the work
			// we thought we were assigned having been stolen by the workstealer
			fmt.Fprintf(os.Stderr, "Internal Error copying task to worker processing %s %s->%s: %v\n", taskContext.Bucket, in, localprocessing, err)
		}
		return nil
	}
	defer os.Remove(localprocessing)

	// Move from inbox to processing (we can do this
	// asynchronously w.r.t. the actual task processing, but will
	// need to sync up at the end, hence the chan)
	doneMovingToProcessing := make(chan struct{})
	go func() {
		for {
			if err := p.client.Moveto(taskContext.Bucket, in, inprogress); err != nil {
				fmt.Fprintf(os.Stderr, "Internal Error moving task to processing %s->%s: %v\n", in, inprogress, err)
				time.Sleep(1 * time.Second)
			} else {
				break
			}
		}
		doneMovingToProcessing <- struct{}{}
	}()

	// Open stdout/err streams
	stdoutWriter, stderrWriter, stdoutReader := p.streamStdout(taskContext)
	defer stdoutWriter.Close()
	defer stderrWriter.Close()

	// Here is where we invoke the underlying task handler
	handlercmd := exec.CommandContext(p.ctx, p.handler[0], slices.Concat(p.handler[1:], []string{localprocessing, localoutbox})...)
	handlercmd.Stderr = io.MultiWriter(os.Stderr, stderrWriter)
	handlercmd.Stdout = io.MultiWriter(os.Stdout, stdoutWriter)
	switch p.opts.CallingConvention {
	case "stdio":
		if stdin, err := os.Open(localprocessing); err != nil {
			fmt.Fprintf(os.Stderr, "Internal Error setting up stdin: %v\n", err)
			return nil
		} else {
			handlercmd.Stdin = stdin
		}
		p.backgroundS3Tasks.Go(func() error {
			defer stdoutReader.Close()
			return p.client.StreamingUpload(taskContext.Bucket, taskContext.AsFile(queue.AssignedAndFinished), stdoutReader)
		})
		defer func() {
			p.backgroundS3Tasks.Go(func() error {
				<-doneMovingToProcessing
				return p.client.Rm(taskContext.Bucket, inprogress)
			})
		}()
	default:
		defer func() { p.handleOutbox(taskContext, inprogress, localoutbox, doneMovingToProcessing) }()
	}
	err = handlercmd.Run()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Handler launch failed:", err)
	}

	// Clean things up
	p.handleExitCode(taskContext, handlercmd.ProcessState.ExitCode())

	if p.opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Worker done with task %s exitCode=%d\n", task, handlercmd.ProcessState.ExitCode())
	}
	return nil
}

// Set up pipes to stream output of the subprocess directly to S3
func (p taskProcessor) streamStdout(taskContext queue.RunContext) (*io.PipeWriter, *io.PipeWriter, *io.PipeReader) {
	stdoutReader, stdoutWriter := io.Pipe()
	if p.opts.CallingConvention == "files" {
		p.backgroundS3Tasks.Go(func() error {
			defer stdoutReader.Close()
			return p.client.StreamingUpload(taskContext.Bucket, taskContext.AsFile(queue.FinishedWithStdout), stdoutReader)
		})
	}

	stderrReader, stderrWriter := io.Pipe()
	p.backgroundS3Tasks.Go(func() error {
		defer stderrReader.Close()
		return p.client.StreamingUpload(taskContext.Bucket, taskContext.AsFile(queue.FinishedWithStderr), stderrReader)
	})

	return stdoutWriter, stderrWriter, stdoutReader
}

// Report and upload exit code
func (p taskProcessor) handleExitCode(taskContext queue.RunContext, exitCode int) {
	p.backgroundS3Tasks.Go(func() error {
		return p.client.Mark(taskContext.Bucket, taskContext.AsFile(queue.FinishedWithCode), strconv.Itoa(exitCode))
	})
	if exitCode == 0 {
		if p.opts.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Succeeded on task %s\n", taskContext.Task)
		}
		p.backgroundS3Tasks.Go(func() error {
			return p.client.Touch(taskContext.Bucket, taskContext.AsFile(queue.FinishedWithSucceeded))
		})
	} else {
		p.backgroundS3Tasks.Go(func() error { return p.client.Touch(taskContext.Bucket, taskContext.AsFile(queue.FinishedWithFailed)) })
	}
}

// Upload output from task processing
func (p taskProcessor) handleOutbox(taskContext queue.RunContext, inprogress, localoutbox string, doneMovingToProcessing chan struct{}) {
	out := taskContext.AsFile(queue.AssignedAndFinished)

	if _, err := os.Stat(localoutbox); err == nil {
		if p.opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Uploading worker-produced outbox file %s->%s\n", localoutbox, out)
		}
		p.backgroundS3Tasks.Go(func() error {
			defer os.Remove(localoutbox)
			return p.client.Upload(taskContext.Bucket, localoutbox, out)
		})
		p.backgroundS3Tasks.Go(func() error {
			<-doneMovingToProcessing
			return p.client.Rm(taskContext.Bucket, inprogress)
		})
	} else {
		if p.opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Moving input to outbox file %s->%s\n", inprogress, out)
		}
		p.backgroundS3Tasks.Go(func() error {
			<-doneMovingToProcessing
			return p.client.Moveto(taskContext.Bucket, inprogress, out)
		})
	}
}
