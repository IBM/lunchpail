package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
	// helpful for debugging
	fmt.Println(os.Environ())

	client, err := newClient()
	if err != nil {
		log.Panic(err)
	}

	// are we starting up or shutting down?
	operation := os.Args[1]
	
	// this is the handler that will be called for each task
	handler := os.Args[2:]

	bucket := os.Getenv(os.Getenv("TASKQUEUE_VAR"))
	prefix := filepath.Join(os.Getenv("LUNCHPAIL"), os.Getenv("RUN_NAME"), "queues", os.Getenv("POOL")+"."+getPodNameSuffix(os.Getenv("POD_NAME")))
	remote := filepath.Join(bucket, prefix)
	inbox := "inbox"
	processing := "processing"
	outbox := "outbox"
	alive := filepath.Join(prefix, inbox, ".alive")
	dead := filepath.Join(prefix, inbox, "/.dead")
	local := os.Getenv("WORKQUEUE")

	if operation == "prestop" {
		fmt.Println("DEBUG Marker worker as done...")
		rm(client, bucket, alive)
		touch(client, bucket, dead)
		fmt.Printf("INFO This worker is shutting down %s\n", strings.Replace(os.Getenv("POD_NAME"), os.Getenv("RUN_NAME") + "-", "", 1))
		return
	}

	startupDelayStr := os.Getenv("LUNCHPAIL_STARTUP_DELAY")
	delay, err := time.ParseDuration(startupDelayStr + "s")
	if err != nil {
		fmt.Println("Internal Error parsing startup delay:", err)
		return
	}
	if delay > 0 {
		fmt.Println("Delaying startup by " + startupDelayStr + " seconds")
		time.Sleep(delay)
	}

	err = touch(client, bucket, alive)
	if err != nil {
		fmt.Println("Internal Error creating alive marker:", err)
		return
	}

	startWatch(handler, client, bucket, prefix, remote, inbox, processing, outbox, local)
}

func killfileExists(client *minio.Client, bucket, prefix string) bool {
	return exists(client, bucket, prefix, "kill")
}

func startWatch(handler []string, client *minio.Client, bucket, prefix, remote, inbox, processing, outbox, local string) {
	for !killfileExists(client, bucket, prefix) {
		tasks, err := lsf(client, bucket, filepath.Join(prefix, inbox))
		if err != nil {
			fmt.Println("Internal Error listing tasks:", err)
		}

		for _, task := range tasks {
			if task != "" {
				// TODO: re-check if task still exists in our inbox before starting on it
				in := filepath.Join(prefix, inbox, task)
				inprogress := filepath.Join(prefix, processing, task)
				out := filepath.Join(prefix, outbox, task)

				// capture exit code, stdout and stderr of the handler
				ec := filepath.Join(prefix, outbox, task+".code")
				succeeded := filepath.Join(prefix, outbox, task+".succeeded")
				failed := filepath.Join(prefix, outbox, task+".failed")
				stdout := filepath.Join(prefix, outbox, task+".stdout")
				stderr := filepath.Join(prefix, outbox, task+".stderr")

				localinbox := filepath.Join(local, inbox)
				localprocessing := filepath.Join(local, processing, task)
				localoutbox := filepath.Join(local, outbox, task)
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

				err = download(client, bucket, in, localprocessing)
				if err != nil {
					if !strings.Contains(err.Error(), "key does not exist") {
						// we ignore "key does not exist" errors, as these result from the work
						// we thought we were assigned having been stolen by the workstealer
						fmt.Printf("Internal Error copying task to worker processing %s %s->%s: %v\n", bucket, in, localprocessing, err)
					}
					continue
				}

				// fmt.Println("sending file to handler: " + in)
				err = os.Remove(localoutbox)
				if err != nil && !os.IsNotExist(err) {
					fmt.Println("Internal Error removing task from local outbox:", err)
					continue
				}

				err = moveto(client, bucket, in, inprogress)
				if err != nil {
					fmt.Printf("Internal Error moving task to global processing %s->%s: %v\n", in, inprogress, err)
					continue
				}

				// signify that the process is still going... or prematurely terminated
				os.WriteFile(localec, []byte("-1"), os.ModePerm)

				handlercmd := exec.Command(handler[0], slices.Concat(handler[1:], []string{localprocessing, localoutbox})...)

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
					continue
				}
				EC := handlercmd.ProcessState.ExitCode()

				os.WriteFile(localec, []byte(fmt.Sprintf("%d", EC)), os.ModePerm)

				err = upload(client, bucket, localec, ec)
				if err != nil {
					fmt.Println("Internal Error moving exitcode to remote:", err)
				}

				err = upload(client, bucket, localstdout, stdout)
				if err != nil {
					fmt.Println("Internal Error moving stdout to remote:", err)
				}

				err = upload(client, bucket, localstderr, stderr)
				if err != nil {
					fmt.Println("Internal Error moving stderr to remote:", err)
				}

				if EC == 0 {
					err = touch(client, bucket, succeeded)
					if err != nil {
						fmt.Println("Internal Error creating succeeded marker:", err)
					}
					// fmt.Println("handler success: " + in)
				} else {
					err = touch(client, bucket, failed)
					if err != nil {
						fmt.Println("Internal Error creating failed marker:", err)
					}
					fmt.Println("Worker error exit code " + strconv.Itoa(EC) + ": " + in)
				}

				err = moveto(client, bucket, inprogress, out)
				if err != nil {
					fmt.Printf("Internal Error moving task to global outbox %s->%s: %v\n", inprogress, out, err)
				}
			}
		}

		time.Sleep(3 * time.Second)
	}

	fmt.Println("DEBUG Worker exiting normally")
}

func getPodNameSuffix(podName string) string {
	// use pod name suffix hash from batch.v1/Job controller
	parts := strings.Split(podName, "-")
	return parts[len(parts)-1]
}

func lsf(client *minio.Client, bucket, prefix string) ([]string, error) {
	objectCh := client.ListObjects(context.Background(), bucket, minio.ListObjectsOptions{
		Prefix:    prefix + "/",
		Recursive: false,
	})

	tasks := []string{}
	for object := range objectCh {
		if object.Err != nil {
			return tasks, object.Err
		}

		task := filepath.Base(object.Key)
		if task != ".alive" {
			tasks = append(tasks, task)
		}
	}

	return tasks, nil
}

func exists(client *minio.Client, bucket, prefix, file string) bool {
	if _, err := client.StatObject(context.Background(), bucket, filepath.Join(prefix, file), minio.StatObjectOptions{}); err == nil {
		return true
	} else {
		return false
	}
}

func copyto(client *minio.Client, bucket, source, destination string) error {
	src := minio.CopySrcOptions{
		Bucket: bucket,
		Object: source,
	}

	dst := minio.CopyDestOptions{
		Bucket: bucket,
		Object: destination,
	}

	_, err := client.CopyObject(context.Background(), dst, src)
	return err
}

func moveto(client *minio.Client, bucket, source, destination string) error {
	if err := copyto(client, bucket, source, destination); err != nil {
		return err
	}

	return rm(client, bucket, source)
}

func upload(client *minio.Client, bucket, source, destination string) error {
	_, err := client.FPutObject(context.Background(), bucket, destination, source, minio.PutObjectOptions{})
	return err
}

func download(client *minio.Client, bucket, source, destination string) error {
	return client.FGetObject(context.Background(), bucket, source, destination, minio.GetObjectOptions{})
}

func touch(client *minio.Client, bucket, filePath string) error {
	r := strings.NewReader("")
	_, err := client.PutObject(context.Background(), bucket, filePath, r, 0, minio.PutObjectOptions{})
	return err
}

func rm(client *minio.Client, bucket, filePath string) error {
	return client.RemoveObject(context.Background(), bucket, filePath, minio.RemoveObjectOptions{})
}

// Initialize minio client object.
func newClient() (*minio.Client, error) {
	endpoint := os.Getenv(os.Getenv("S3_ENDPOINT_VAR"))
	accessKeyID := os.Getenv(os.Getenv("AWS_ACCESS_KEY_ID_VAR"))
	secretAccessKey := os.Getenv(os.Getenv("AWS_SECRET_ACCESS_KEY_VAR"))

	useSSL := true
	if !strings.HasPrefix(endpoint, "https") {
		useSSL = false
	}

	endpoint = strings.Replace(endpoint, "https://", "", 1)
	endpoint = strings.Replace(endpoint, "http://", "", 1)

	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})

}
