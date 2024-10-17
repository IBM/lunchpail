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

	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/runtime/queue"
)

func killfileExists(client queue.S3Client, bucket, prefix string) bool {
	return client.Exists(bucket, prefix, "kill")
}

func startWatch(ctx context.Context, handler []string, client queue.S3Client, opts Options) error {
	if err := client.Mkdirp(opts.Queue.Bucket); err != nil {
		return err
	}

	if opts.LogOptions.Debug {
		fmt.Fprintf(os.Stderr, "Lunchpail worker touching alive file bucket=%s path=%s\n", opts.Queue.Bucket, opts.Queue.Alive)
	}
	err := client.Touch(opts.Queue.Bucket, opts.Queue.Alive)
	if err != nil {
		return err
	}

	localdir, err := os.MkdirTemp("", "lunchpail_local_queue_")
	if err != nil {
		return err
	}

	tasks, errs := client.Listen(opts.Queue.Bucket, opts.Queue.ListenPrefix, "", false)
	for {
		if killfileExists(client, opts.Queue.Bucket, opts.Queue.ListenPrefix) {
			break
		}

		select {
		case err := <-errs:
			if opts.LogOptions.Verbose {
				fmt.Fprintln(os.Stderr, err)
			}

			// sleep for a bit
			s := opts.PollingInterval
			if s == 0 {
				s = 3
			}
			time.Sleep(time.Duration(s) * time.Second)

		case <-tasks:
		}

		tasks, err := client.Lsf(opts.Queue.Bucket, api.Inbox(opts.Queue.ListenPrefix))
		if err != nil {
			return err
		}

		for _, task := range tasks {
			if task != "" {
				// TODO: re-check if task still exists in our inbox before starting on it
				in := api.InboxTask(opts.Queue.ListenPrefix, task)
				inprogress := api.ProcessingTask(opts.Queue.ListenPrefix, task)
				out := api.OutboxTask(opts.Queue.ListenPrefix, task)

				// capture exit code, stdout and stderr of the handler
				ec := api.ExitCodeTask(opts.Queue.ListenPrefix, task)
				succeeded := api.SucceededTask(opts.Queue.ListenPrefix, task)
				stdout := api.StdoutTask(opts.Queue.ListenPrefix, task)
				stderr := api.StderrTask(opts.Queue.ListenPrefix, task)

				localinbox := filepath.Join(localdir, "inbox")
				localprocessing := filepath.Join(localdir, "processing", task)
				localoutbox := filepath.Join(localdir, "outbox", task)
				localec := localoutbox + ".code"
				localstdout := localoutbox + ".stdout"
				localstderr := localoutbox + ".stderr"

				err := os.MkdirAll(localinbox, os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local inbox:", err)
					continue
				}
				err = os.MkdirAll(filepath.Dir(localprocessing), os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local processing:", err)
					continue
				}
				err = os.MkdirAll(filepath.Dir(localoutbox), os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local outbox:", err)
					continue
				}

				err = client.Download(opts.Queue.Bucket, in, localprocessing)
				if err != nil {
					if !strings.Contains(err.Error(), "key does not exist") {
						// we ignore "key does not exist" errors, as these result from the work
						// we thought we were assigned having been stolen by the workstealer
						fmt.Printf("Internal Error copying task to worker processing %s %s->%s: %v\n", opts.Queue.Bucket, in, localprocessing, err)
					}
					continue
				}

				// fmt.Println("sending file to handler: " + in)
				err = os.Remove(localoutbox)
				if err != nil && !os.IsNotExist(err) {
					fmt.Println("Internal Error removing task from local outbox:", err)
					continue
				}

				err = client.Moveto(opts.Queue.Bucket, in, inprogress)
				if err != nil {
					fmt.Printf("Internal Error moving task to global processing %s->%s: %v\n", in, inprogress, err)
					continue
				}

				// signify that the process is still going... or prematurely terminated
				os.WriteFile(localec, []byte("-1"), os.ModePerm)

				handlercmd := exec.CommandContext(ctx, handler[0], slices.Concat(handler[1:], []string{localprocessing, localoutbox})...)

				// open stdout/err files for writing
				stdoutfile, err := os.Create(localstdout)
				if err != nil {
					fmt.Println("Internal Error creating stdout file:", err)
					continue
				}
				defer stdoutfile.Close()

				stderrfile, err := os.Create(localstderr)
				if err != nil {
					fmt.Println("Internal Error creating stderr file:", err)
					continue
				}
				defer stderrfile.Close()

				multiout := io.MultiWriter(os.Stdout, stdoutfile)
				multierr := io.MultiWriter(os.Stderr, stderrfile)
				handlercmd.Stdout = multiout
				handlercmd.Stderr = multierr
				err = handlercmd.Run()
				if err != nil {
					fmt.Println("Internal Error running the handler:", err)
					multierr.Write([]byte(err.Error()))
				}
				EC := handlercmd.ProcessState.ExitCode()

				os.WriteFile(localec, []byte(fmt.Sprintf("%d", EC)), os.ModePerm)

				err = client.Upload(opts.Queue.Bucket, localec, ec)
				if err != nil {
					fmt.Println("Internal Error moving exitcode to remote:", err)
				}

				err = client.Upload(opts.Queue.Bucket, localstdout, stdout)
				if err != nil {
					fmt.Println("Internal Error moving stdout to remote:", err)
				}

				err = client.Upload(opts.Queue.Bucket, localstderr, stderr)
				if err != nil {
					fmt.Println("Internal Error moving stderr to remote:", err)
				}

				if EC == 0 {
					if opts.LogOptions.Debug {
						fmt.Printf("Worker succeeded on task %s\n", localprocessing)
					}
					err = client.Touch(opts.Queue.Bucket, succeeded)
					if err != nil {
						fmt.Println("Internal Error creating succeeded marker:", err)
					}
				} else {
					err = client.Touch(opts.Queue.Bucket, api.FailedTask(opts.Queue.ListenPrefix, task))
					if err != nil {
						fmt.Println("Internal Error creating failed marker:", err)
					}
					fmt.Println("Worker error with exit code " + strconv.Itoa(EC) + " while processing " + filepath.Base(in))
				}

				if _, err := os.Stat(localoutbox); err == nil {
					if opts.LogOptions.Debug {
						fmt.Printf("Uploading worker-produced outbox file %s->%s\n", localoutbox, out)
					}
					if err := client.Upload(opts.Queue.Bucket, localoutbox, out); err != nil {
						fmt.Printf("Internal Error uploading task to global outbox %s->%s: %v\n", localoutbox, out, err)
					}
				} else if err := client.Moveto(opts.Queue.Bucket, inprogress, out); err != nil {
					fmt.Printf("Internal Error moving task to global outbox %s->%s: %v\n", inprogress, out, err)
				}
			}
		}
	}

	if opts.LogOptions.Verbose {
		fmt.Println("Worker exiting normally")
	}

	return nil
}
