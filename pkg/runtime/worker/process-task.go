package worker

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync/atomic"
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

	// Download task
	localprocessing := filepath.Join(p.localdir, task)
	if err := p.client.Download(taskContext.Bucket, in, localprocessing); err != nil {
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
	var stdin io.Reader
	handlerArgs := p.handler[1:]
	switch p.opts.CallingConvention {
	case "stdio":
		var err error
		stdin, err = os.Open(localprocessing)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Internal Error setting up stdin: %v\n", err)
			return nil
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
		// TODO: support multiple outputs from the handler. #398
		localoutbox := filepath.Join(p.localdir, "outbox")
		err := os.MkdirAll(localoutbox, os.ModePerm)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Internal Error creating local outbox:", err)
			return nil
		}
		handlerArgs = append(handlerArgs, localprocessing)                                            // argv[1] is input filepath
		handlerArgs = append(handlerArgs, filepath.Join(localoutbox, filepath.Base(localprocessing))) // argv[2] is suggested output filepath
		handlerArgs = append(handlerArgs, localoutbox)                                                // argv[3] is output directory if the handler wants to choose its own file names or output multiple files
		// Note: we will RemoveAll(localoutbox) in handleOutbox

		defer func() { p.handleOutbox(taskContext, inprogress, localoutbox, doneMovingToProcessing) }()
	}

	handlercmd := exec.CommandContext(p.ctx, p.handler[0], handlerArgs...)
	handlercmd.Stdin = stdin
	handlercmd.Stderr = io.MultiWriter(os.Stderr, stderrWriter)
	handlercmd.Stdout = io.MultiWriter(os.Stdout, stdoutWriter)
	if err := handlercmd.Run(); err != nil {
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
	outputFiles, err := os.ReadDir(localoutbox)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Listing output files", err)
	}

	if len(outputFiles) > 0 {
		var uploadCount atomic.Uint32
		for _, outputFile := range outputFiles {
			p.backgroundS3Tasks.Go(func() error {
				defer func() {
					uploadCount.Add(1)
					if uploadCount.Load() == uint32(len(outputFiles)) {
						// Then we have uploaded all files. Remove the local directory.
						defer os.Remove(localoutbox)
					}
				}()

				out := taskContext.ForTask(outputFile.Name()).AsFile(queue.AssignedAndFinished)
				if p.opts.LogOptions.Verbose {
					fmt.Fprintf(os.Stderr, "Uploading worker-produced outbox file %s->%s\n", outputFile.Name(), out)
				}
				return p.client.Upload(taskContext.Bucket, filepath.Join(localoutbox, outputFile.Name()), out)
			})
		}
		p.backgroundS3Tasks.Go(func() error {
			<-doneMovingToProcessing
			return p.client.Rm(taskContext.Bucket, inprogress)
		})
	} else {
		out := taskContext.AsFile(queue.AssignedAndFinished)

		if p.opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Moving input to outbox file %s->%s\n", inprogress, out)
		}
		p.backgroundS3Tasks.Go(func() error {
			<-doneMovingToProcessing
			return p.client.Moveto(taskContext.Bucket, inprogress, out)
		})
	}
}
