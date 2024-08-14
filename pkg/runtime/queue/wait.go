package queue

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"time"
)

func (c S3Client) WaitForCompletion(task string, verbose bool) (int, error) {
	for {
		doneTasks, err := c.Lsf(c.Paths.Bucket, filepath.Join(c.Paths.PoolPrefix, c.Paths.Outbox))
		if err != nil {
			return 0, err
		}

		if idx := slices.IndexFunc(doneTasks, func(otask string) bool { return otask == task }); idx >= 0 {
			break
		} else {
			if verbose {
				fmt.Fprintf(os.Stderr, "Still waiting for task completion %s. Here is what is done so far: %v\n", task, doneTasks)
			}
			time.Sleep(3 * time.Second)
		}
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Task completed %s\n", task)
	}

	codeFile := filepath.Join(c.Paths.PoolPrefix, c.Paths.Outbox, task+".code")
	if code, err := c.Get(c.Paths.Bucket, codeFile); err != nil {
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
