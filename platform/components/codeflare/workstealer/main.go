package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// avoid "File not found" for the $queues/* glob below
// shopt -s nullglob

func reportSize(size string) {
	fmt.Printf("codeflare.dev unassigned %s\n", size)
}

func main() {
	queue := os.Getenv("QUEUE")
	inbox := filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
	queues := filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

	for {
		if f, err := os.Stat(inbox); err == nil && f.IsDir() {
			fmt.Printf("[workstealer] Scanning inbox: %s\n", inbox)

			// current unassigned work items
			f, err := os.Open(inbox)
			if err != nil {
				log.Fatalf("[workstealer] Failed to read inbox directory: %v\n", err)
				return
			}

			files, err := f.Readdir(0)
			if err != nil {
				log.Fatalf("[workstealer] Failed to read contents of inbox directory: %v\n", err)
			}

			nFiles := 0
			nAssigned := 0

			for _, file := range files {
				fileName := file.Name()
				if strings.HasSuffix(fileName, ".lock") || strings.HasSuffix(fileName, ".done") {
					continue
				}

				// keep track of how many we have yet to assign
				nFiles++
				filePath := filepath.Join(inbox, fileName)

				if _, err := os.Stat(filePath + ".done"); err == nil {
					// the work is already flagged as done
					nAssigned++
					fmt.Printf("[workstealer] skipping already-done file=%s nAassigned=%d\n", fileName, nAssigned)
					continue
				}

				if _, err := os.Stat(filePath + ".lock"); err == nil {
					// the file may be done? check...
					lockFile, err := os.ReadFile(filePath + ".lock")
					if err != nil {
						log.Fatalf("[workstealer] Failed to read lock file: %v\n", err)
					}
					worker := strings.TrimSpace(string(lockFile))
					doneFile := filepath.Join(worker, "outbox", fileName+".done")
					fmt.Printf("[workstealer] checking for donefile %s", doneFile)
					if _, err := os.Stat(doneFile); err == nil {
						// yes, it is done, flag it as such
						nAssigned++
						fmt.Printf("[workstealer] skipping already-done (2) file=%s nAssigned=%d\n", fileName, nAssigned)
						if err := os.WriteFile(filePath+".done", []byte{}, 0644); err != nil {
							log.Fatalf("[workstealer] Failed to touch done file: %v\n", err)
						}
						if err := os.Remove(filePath + ".lock"); err != nil {
							log.Fatalf("[workstealer] Failed to remove lock file: %v\n", err)
						}
						continue
					}
				}

				// otherwise, pick a worker randomly and send the task to that worker's queue
				workerDirs, err := filepath.Glob(filepath.Join(queues, "*"))
				if err != nil {
					log.Fatalf("[workstealer] Failed to get worker directories: %v\n", err)
				}

				if len(workerDirs) == 0 {
					fmt.Println("[workstealer] Warning: no queues ready")
					break
				}

				workerDir := workerDirs[rand.Intn(len(workerDirs))]
				queue := filepath.Join(workerDir, "inbox")

				if _, err := os.Stat(filepath.Join(queue, ".alive")); os.IsNotExist(err) {
					/* TODO: maybe we need to loop more tightly
					   here over possibly available workers?
					   otherwise, we may delay 5 seconds in
					   assigning a task, even when there are other
					   workers that *are* active? */
					fmt.Printf("[workstealer] skipping inactive queue=%s\n", queue)

					// unlock any files owned by that worker
					lockFiles, err := filepath.Glob(filepath.Join(inbox, "*.lock"))
					if err != nil {
						log.Fatalf("[workstealer] Failed to get lock files: %v\n", err)
					}

					for _, lockFile := range lockFiles {
						lockContent, err := os.ReadFile(lockFile)
						if err != nil {
							log.Fatalf("[workstealer] Failed to read lock file: %v\n", err)
						}
						if strings.TrimSpace(string(lockContent)) == workerDir {
							doneFile := filepath.Join(workerDir, "outbox", strings.TrimSuffix(filepath.Base(lockFile), ".lock"))
							fmt.Printf("[workstealer] Checking if task is done: %s\n", doneFile)
							_, err := os.Stat(doneFile)
							if err == nil {
								fmt.Printf("[workstealer] Removing finished task owned by dead worker=%s filelock=%s\n", workerDir, lockFile)
								filePath = strings.TrimSuffix(filepath.Base(lockFile), ".lock")
								if err := os.WriteFile(filePath+".done", []byte{}, 0644); err != nil {
									log.Fatalf("[workstealer] Failed to touch done file: %v\n", err)
								}
							} else {
								fmt.Printf("[workstealer] Unlocking task owned by dead worker=%s filelock=%s", workerDir, lockFile)
							}
							if err := os.Remove(lockFile); err != nil {
								log.Fatalf("[workstealer] Failed to remove lock file: %v\n", err)
							}
						}
					}

					continue
				}

				if _, err := os.Stat(filepath.Join(inbox, fileName+".lock")); err == nil {
					nAssigned++
					fmt.Printf("[workstealer] skipping already-locked file=%s nAssigned=%d\n", fileName, nAssigned)
				} else if fi, err := os.Stat(queue); err == nil && fi.IsDir() && fileName != "" {
					nAssigned++
					fmt.Printf("[workstealer] Moving task=%s to queue=%s nAssigned=%d\n", fileName, queue, nAssigned)
					os.WriteFile(filepath.Join(inbox, fileName+".lock"), []byte(workerDir), 0644)
					data, _ := os.ReadFile(filepath.Join(inbox, fileName))
					os.WriteFile(filepath.Join(queue, fileName), data, 0644)
				} else {
					fmt.Printf("[workstealer] Warning: strange! Unable to assign task to a worker: %s\n", fileName)
					if _, err := os.Stat(queue); os.IsNotExist(err) {
						fmt.Printf("[workstealer] Warning: Not a directory=%s\n", queue)
					}
					if fileName == "" {
						fmt.Println("[workstealer] Warning: Empty")
					}
					if _, err := os.Stat(filepath.Join(inbox, fileName)); os.IsNotExist(err) {
						fmt.Printf("[workstealer] Warning: Not a file task=%s\n", filepath.Join(inbox, fileName))
					}
					if _, err := os.Stat(filepath.Join(inbox, fileName+".lock")); err == nil {
						lockFile, _ := os.ReadFile(filepath.Join(inbox, fileName+".lock"))
						fmt.Printf("[workstealer] Warning: Already owned %s\n", string(lockFile))
					}
				}
			}

			reportSize(strconv.Itoa(nFiles - nAssigned))
		}
		time.Sleep(5 * time.Second)
	}
}
