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

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/runtime/queue"
)

type taskProcessor struct {
	ctx               context.Context
	client            queue.S3Client
	handler           []string
	localdir          string
	opts              Options
	backgroundS3Tasks *errgroup.Group
}

// Process one task by invoking the given `handler` command line on
// the given `task` (stored in S3, in the inbox for this worker)
func (p taskProcessor) process(task string) error {
	opts := p.opts
	client := p.client

	if task != "" {
		task = filepath.Base(task)

		if opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Worker starting task %s\n", task)
		}

		a := opts.PathArgs.ForTask(task)
		in := a.TemplateP(api.AssignedAndPending)
		inprogress := a.TemplateP(api.AssignedAndProcessing)
		out := a.TemplateP(api.AssignedAndFinished)
		ec := a.TemplateP(api.FinishedWithCode)
		failed := a.TemplateP(api.FinishedWithFailed)
		succeeded := a.TemplateP(api.FinishedWithSucceeded)
		stdout := a.TemplateP(api.FinishedWithStdout)
		stderr := a.TemplateP(api.FinishedWithStderr)

		localprocessing := filepath.Join(p.localdir, task)
		localoutbox := filepath.Join(p.localdir, "outbox", task)
		localstdout := localprocessing + ".stdout"
		localstderr := localprocessing + ".stderr"

		// Currently, we don't need localoutbox to be a
		// directory. This is future-proofing for handling
		// multiple outputs from the handler. #398
		err := os.MkdirAll(filepath.Dir(localoutbox), os.ModePerm)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Internal Error creating local outbox:", err)
			return nil
		}

		err = client.Download(opts.PathArgs.Bucket, in, localprocessing)
		if err != nil {
			if !strings.Contains(err.Error(), "key does not exist") {
				// we ignore "key does not exist" errors, as these result from the work
				// we thought we were assigned having been stolen by the workstealer
				fmt.Fprintf(os.Stderr, "Internal Error copying task to worker processing %s %s->%s: %v\n", opts.PathArgs.Bucket, in, localprocessing, err)
			}
			return nil
		}

		doneMovingToProcessing := make(chan struct{})
		go func() {
			if client.Moveto(opts.PathArgs.Bucket, in, inprogress) != nil {
				fmt.Fprintf(os.Stderr, "Internal Error moving task to processing %s->%s: %v\n", in, inprogress, err)
			}
			doneMovingToProcessing <- struct{}{}
		}()

		// open stdout/err files for writing
		stdoutfile, err := os.Create(localstdout)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Internal Error creating stdout file:", err)
			return nil
		}
		defer stdoutfile.Close()

		stderrfile, err := os.Create(localstderr)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Internal Error creating stderr file:", err)
			return nil
		}
		defer stderrfile.Close()

		handlercmd := exec.CommandContext(p.ctx, p.handler[0], slices.Concat(p.handler[1:], []string{localprocessing, localoutbox})...)
		handlercmd.Stdout = io.MultiWriter(os.Stdout, stdoutfile)
		handlercmd.Stderr = io.MultiWriter(os.Stderr, stderrfile)
		err = handlercmd.Run()
		if err != nil {
			fmt.Fprintln(os.Stderr, "Internal Error running the handler:", err)
			stderrfile.Write([]byte(err.Error()))
		}

		exitCode := handlercmd.ProcessState.ExitCode()

		p.backgroundS3Tasks.Go(func() error { return client.Mark(opts.PathArgs.Bucket, ec, strconv.Itoa(exitCode)) })
		p.backgroundS3Tasks.Go(func() error { return client.Upload(opts.PathArgs.Bucket, localstdout, stdout) })
		p.backgroundS3Tasks.Go(func() error { return client.Upload(opts.PathArgs.Bucket, localstderr, stderr) })
		if exitCode == 0 {
			if opts.LogOptions.Debug {
				fmt.Fprintf(os.Stderr, "Succeeded on task %s\n", localprocessing)
			}
			p.backgroundS3Tasks.Go(func() error { return client.Touch(opts.PathArgs.Bucket, succeeded) })
		} else {
			fmt.Fprintln(os.Stderr, "Error with exit code "+strconv.Itoa(exitCode)+" while processing "+filepath.Base(in))
			p.backgroundS3Tasks.Go(func() error { return client.Touch(opts.PathArgs.Bucket, failed) })
		}

		if _, err := os.Stat(localoutbox); err == nil {
			if opts.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Uploading worker-produced outbox file %s->%s\n", localoutbox, out)
			}
			p.backgroundS3Tasks.Go(func() error { return client.Upload(opts.PathArgs.Bucket, localoutbox, out) })
			p.backgroundS3Tasks.Go(func() error {
				<-doneMovingToProcessing
				return client.Rm(opts.PathArgs.Bucket, inprogress)
			})
		} else {
			if opts.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Moving input to outbox file %s->%s\n", inprogress, out)
			}
			p.backgroundS3Tasks.Go(func() error {
				<-doneMovingToProcessing
				return client.Moveto(opts.PathArgs.Bucket, inprogress, out)
			})
		}

		if opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Worker done with task %s\n", task)
		}
	}

	return nil
}
