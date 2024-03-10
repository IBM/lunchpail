package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
)

func reportUnassigned(size uint) {
	fmt.Fprintf(os.Stderr, "jaas.dev unassigned %d\n", size)
}

func reportDone(size uint) {
	fmt.Fprintf(os.Stderr, "jaas.dev done %d\n", size)
}

/**
 * Emit the path to the file we changed
 */
func reportChangedFile(filepath string) {
	fmt.Printf("%s\n", filepath)
}

/**
 * Assumed to be called every time something has changed in the
 * `queue` directory. This will emit to stdout a newline-separated
 * stream of filepaths, one per file that it has changed in some way.
 */
func main() {
	queue := os.Getenv("QUEUE")
	inbox := filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
	outbox := filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
	queues := filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

	fmt.Fprintf(os.Stderr, "[workstealer] Starting with inbox=%s outbox=%s queues=%s\n", inbox, outbox, queues)

	// Keep track of how many tasks we have moved to the final
	// outbox. TODO: don't start from 0, we need to scan the
	// outbox to look for bits from prior instances of the
	// WorkStealer (e.g. if the pod fails)
	var nDone uint = 0

	err := os.MkdirAll(outbox, 0700)
	if err != nil {
		log.Fatalf("[workstealer] Failed to create outbox directory: %v\n", err)
		return
	}

	{
		// Check for existence of unassigned inbox
		if f, err := os.Stat(inbox); err == nil && f.IsDir() {
			fmt.Fprintf(os.Stderr, "[workstealer] Scanning inbox: %s\n", inbox)

			// We will enumerate the unassigned inbox to find the current unassigned work items
			f, err := os.Open(inbox)
			if err != nil {
				log.Fatalf("[workstealer] Failed to read inbox directory: %v\n", err)
				return
			}

			// Here is the readdir/enumeration of the unassigned directory
			files, err := f.Readdir(0)
			if err != nil {
				log.Fatalf("[workstealer] Failed to read contents of inbox directory: %v\n", err)
			}

			// We will tally up the total number of tasks (nFiles) and the number already assigned to
			// a worker (nAssigned)
			var nFiles uint = 0
			var nAssigned uint = 0

			// Here is the loop over files in the unassigned inbox directory
			for _, file := range files {
				fileName := file.Name()
				if strings.HasSuffix(fileName, ".lock") || strings.HasSuffix(fileName, ".done") {
					// skip over the lock files
					continue
				}

				// keep track of how many we have yet to assign
				nFiles++
				filePath := filepath.Join(inbox, fileName)
				doneMarker := filePath+".done"
				lockMarker := filePath+".lock"

				if _, err := os.Stat(doneMarker); err == nil {
					// the work is already flagged as done
					nAssigned++
					fmt.Fprintf(os.Stderr, "[workstealer] skipping already-done file=%s nAassigned=%d\n", fileName, nAssigned)
					continue
				}

				if _, err := os.Stat(lockMarker); err == nil {
					// Then this task is locked, i.e. already assigned to a worker.
					lockFile, err := os.ReadFile(lockMarker)
					if err != nil {
						log.Fatalf("[workstealer] Failed to read lock file: %v\n", err)
					}

					// The lock file contents will the id of the owning worker
					worker := strings.TrimSpace(string(lockFile))

					// Check the worker's outbox for the task
					fileInWorkerOutbox := filepath.Join(worker, "outbox", fileName)

					fmt.Fprintf(os.Stderr, "[workstealer] checking worker outbox %s\n", fileInWorkerOutbox)
					if _, err := os.Stat(fileInWorkerOutbox); err == nil {
						// Then yes, this task is done. Flag it as such: increment nAssigned,
						// touch the .done file and remove the .lock file
						nAssigned++
						fmt.Fprintf(os.Stderr, "[workstealer] skipping already-done (2) file=%s nAssigned=%d\n", fileName, nAssigned)

						// ...touch the done file
						if err := os.WriteFile(doneMarker, []byte{}, 0644); err != nil {
							log.Fatalf("[workstealer] Failed to touch done file: %v\n", err)
						} else {
							reportChangedFile(doneMarker)
						}

						// ...remove the lock file
						if err := os.Remove(lockMarker); err != nil {
							log.Fatalf("[workstealer] Failed to remove lock file: %v\n", err)
						} else {
							reportChangedFile(lockMarker)
						}

						// move the output to the final/global (i.e. not per-worker) outbox
						fullyDoneOutputFilePath := filepath.Join(outbox, fileName)
						err := os.Rename(fileInWorkerOutbox, fullyDoneOutputFilePath)
						nDone++
						if err != nil {
							log.Fatalf("[workstealer] Failed to copy output to final outbox: %v\n", err)
						} else {
							reportChangedFile(fullyDoneOutputFilePath)
						}

						// Nothing more to do for this task file
						continue
					}
				}

				// If we get here, then we have an unassigned task. Pick a worker randomly
				// and send the task to that worker's queue.
				workerDirs, err := filepath.Glob(filepath.Join(queues, "*"))
				if err != nil {
					log.Fatalf("[workstealer] Failed to get worker directories: %v\n", err)
				}

				if len(workerDirs) == 0 {
					fmt.Fprintln(os.Stderr, "[workstealer] Warning: no queues ready")
					continue
				}

				// Pick a random worker
				workerDir := workerDirs[rand.Intn(len(workerDirs))]
				queue := filepath.Join(workerDir, "inbox")

				// Check if that worker is no longer alive
				if _, err := os.Stat(filepath.Join(queue, ".alive")); os.IsNotExist(err) {
					/* TODO: maybe we need to loop more tightly
					   here over possibly available workers?
					   otherwise, we may delay 5 seconds in
					   assigning a task, even when there are other
					   workers that *are* active? */
					fmt.Fprintf(os.Stderr, "[workstealer] skipping inactive queue=%s\n", queue)

					// If the worker has any assigned tasks, unlock those files owned by that worker
					lockFiles, err := filepath.Glob(filepath.Join(inbox, "*.lock"))
					if err != nil {
						log.Fatalf("[workstealer] Failed to get lock files: %v\n", err)
					}

					// Iterate over files locked by this worker
					for _, lockFile := range lockFiles {
						lockContent, err := os.ReadFile(lockFile)
						if err != nil {
							log.Fatalf("[workstealer] Failed to read lock file: %v\n", err)
						}
						if strings.TrimSpace(string(lockContent)) == workerDir {
							doneFile := filepath.Join(workerDir, "outbox", strings.TrimSuffix(filepath.Base(lockFile), ".lock"))
							fmt.Fprintf(os.Stderr, "[workstealer] Checking if task is done: %s\n", doneFile)
							_, err := os.Stat(doneFile)
							if err == nil {
								fmt.Fprintf(os.Stderr, "[workstealer] Removing finished task owned by dead worker=%s filelock=%s\n", workerDir, lockFile)
								filePath = strings.TrimSuffix(filepath.Base(lockFile), ".lock")
								if err := os.WriteFile(doneMarker, []byte{}, 0644); err != nil {
									log.Fatalf("[workstealer] Failed to touch done file: %v\n", err)
								} else {
									reportChangedFile(doneMarker)
								}
							} else {
								fmt.Fprintf(os.Stderr, "[workstealer] Unlocking task owned by dead worker=%s filelock=%s", workerDir, lockFile)
							}
							if err := os.Remove(lockFile); err != nil {
								log.Fatalf("[workstealer] Failed to remove lock file: %v\n", err)
							} else {
								reportChangedFile(lockFile)
							}
						}
					}

					continue
				}

				if _, err := os.Stat(lockMarker); err == nil {
					nAssigned++
					fmt.Fprintf(os.Stderr, "[workstealer] skipping already-locked file=%s nAssigned=%d\n", fileName, nAssigned)
				} else if fi, err := os.Stat(queue); err == nil && fi.IsDir() && fileName != "" {
					// here is where we assign a task to a worker
					nAssigned++
					fmt.Fprintf(os.Stderr, "[workstealer] Moving task=%s to queue=%s nAssigned=%d\n", fileName, queue, nAssigned)
					filePathToWorkerInbox := filepath.Join(queue, fileName)

					os.WriteFile(lockMarker, []byte(workerDir), 0644)
					data, _ := os.ReadFile(filepath.Join(inbox, fileName))
					os.WriteFile(filePathToWorkerInbox, data, 0644)

					reportChangedFile(lockMarker)
					reportChangedFile(filePathToWorkerInbox)
				} else {
					fmt.Fprintf(os.Stderr, "[workstealer] Warning: strange! Unable to assign task to a worker: %s\n", fileName)
					if _, err := os.Stat(queue); os.IsNotExist(err) {
						fmt.Fprintf(os.Stderr, "[workstealer] Warning: Not a directory=%s\n", queue)
					}
					if fileName == "" {
						fmt.Fprintln(os.Stderr, "[workstealer] Warning: Empty")
					}
					if _, err := os.Stat(filepath.Join(inbox, fileName)); os.IsNotExist(err) {
						fmt.Fprintf(os.Stderr, "[workstealer] Warning: Not a file task=%s\n", filepath.Join(inbox, fileName))
					}
					if _, err := os.Stat(lockMarker); err == nil {
						lockFile, _ := os.ReadFile(lockMarker)
						fmt.Fprintf(os.Stderr, "[workstealer] Warning: Already owned %s\n", string(lockFile))
					}
				}
			}

			reportUnassigned(nFiles - nAssigned)
			reportDone(nDone)
		}
	}
}
