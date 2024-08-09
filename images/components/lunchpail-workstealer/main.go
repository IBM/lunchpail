package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"strconv"
	"time"
)

var debug = os.Getenv("DEBUG") != ""
var run = os.Getenv("RUN_NAME")
var queue = os.Getenv("LUNCHPAIL_QUEUE_PATH")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

type client struct {
	s3 S3Client
	paths filepaths
}

func sleepyTime(envvar string, defaultValue int) time.Duration {
	t := defaultValue
	if os.Getenv(envvar) != "" {
		if s, err := strconv.Atoi(os.Getenv(envvar)); err != nil {
			panic(fmt.Errorf("%s not an integer: %s", envvar, os.Getenv(envvar)))
		} else {
			t = s
		}
	}

	return time.Duration(t) * time.Second
}

// If tests need to capture some output before we exit, they can
// increase this. Otherwise, we will have a default grace period to
// allow for UIs e.g. to do a last poll of queue info.
func sleepBeforeExit() {
	time.Sleep(sleepyTime("SLEEP_BEFORE_EXIT", 10))
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func main() {
	s3, err := newS3Client()
	if err != nil {
		panic(err)
	}
	c := client{s3, pathsForRun()}
	s := sleepyTime("QUEUE_POLL_INTERVAL_SECONDS", 3)

	// temporary; support for test7
	if len(os.Args) > 1 && os.Args[1] == "copy" {
		srcDir := os.Args[2]
		bucket := os.Args[3]

		fmt.Printf("Uploading files from dir=%s to bucket=%s\n", srcDir, bucket)
		if err := c.s3.Mkdirp(bucket); err != nil {
			panic(err)
		}
		err := filepath.WalkDir(srcDir, func(path string, dir fs.DirEntry, err error) error {
			if err != nil {
				return err
			} else if !dir.IsDir() {
				for i := range 10 {
					if err := c.s3.upload(bucket, path, strings.Replace(path, srcDir+"/", "", 1)); err == nil {
						break
					} else {
						fmt.Fprintf(os.Stderr, "Retrying upload iter=%d path=%s\n%v\n", i, path, err)
						time.Sleep(1 * time.Second)
					}
				}
			}
			return nil
		})
		if err != nil {
			panic(err)
		}
		os.Exit(0)
		return
	} else if len(os.Args) > 1 && os.Args[1] == "qls" {
		prefix := filepath.Join(c.paths.prefix, os.Args[2])
		for o := range c.s3.ListObjects(c.paths.bucket, prefix, true) {
			fmt.Println(strings.Replace(o.Key, prefix + "/", "", 1))
		}
		os.Exit(0)
		return
	} else if len(os.Args) > 1 && os.Args[1] == "qcat" {
		prefix := filepath.Join(c.paths.prefix, os.Args[2])
		if err := c.s3.Cat(c.paths.bucket, prefix); err != nil {
			panic(err)
		}
		os.Exit(0)
		return
	}
	
	fmt.Printf("INFO Workstealer starting")
	printenv()

	if err := launchMinioServer(); err != nil {
		panic(err)
	}

	for {
		// fetch model
		m := c.fetchModel()
		m.report()

		// assess it
		if c.assess(m) {
			// all done
			break
		}

		// sleep for a bit
		time.Sleep(s)
	}

	sleepBeforeExit()
	fmt.Fprintln(os.Stderr, "INFO The job should be all done now")
}
