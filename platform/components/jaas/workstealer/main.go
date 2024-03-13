package main

import (
	"io"
	"os"
	"fmt"
	"log"
	"bufio"
	"regexp"
	//	"strings"
	"math/rand"
	"path/filepath"
)

//
// We want to identify four classes of changes:
//
// 1. Unassigned/Assigned/Finished Tasks, indicated by any new files in inbox/assigned/finished
// 2. LiveWorkers, indicated by new .alive file in queues/{workerId}/inbox/.alive
// 3. DeadWorkers, indicated by deletion of .alive files
// 4. CompletedTaskByWorker, indicated by any new files in queues/{workerId}/outbox
//
type HowChanged int
const (
	Added HowChanged = iota
	Removed
	Unchanged
)
type WhatChanged int
const (
	UnassignedTask WhatChanged = iota
	AssignedTask
	FinishedTask

	LiveWorker
	DeadWorker

	CompletedTaskByWorker

	Nothing
)

var queue = os.Getenv("QUEUE")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var assigned = filepath.Join(queue, "assigned")
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

var unassignedTaskPattern = regexp.MustCompile("^inbox/(.+)$")
var assignedTaskPattern = regexp.MustCompile("^assigned/(.+)$")
var finishedTaskPattern = regexp.MustCompile("^finished/(.+)$")
var liveWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]alive$")
var completedTaskPattern = regexp.MustCompile("^queues/(.+)/outbox/(.+)$")

//
// Indicate the current number of unassigned tasks 
//
func reportUnassigned(size int) {
	fmt.Fprintf(os.Stderr, "jaas.dev unassigned %d\n", size)
}

//
// Indicate the current number of assigned tasks 
//
func reportAssigned(size int) {
	fmt.Fprintf(os.Stderr, "jaas.dev assigned %d\n", size)
}

//
// Indicate the current number of fully completed tasks 
//
func reportDone(size int) {
	fmt.Fprintf(os.Stderr, "jaas.dev done %d\n", size)
}

//
// Indicate the current number of live workers
//
func reportLiveWorkers(size int) {
	fmt.Fprintf(os.Stderr, "jaas.dev liveworkers %d\n", size)
}

//
// Emit the path to the file we changed
//
func reportChangedFile(filepath string) {
	fmt.Printf("%s\n", filepath)
}

//
// Determine from a diff the `HowChanged` property
//
func howChanged(marker byte) HowChanged {
	switch marker {
	case '+':
		return Added
	case '-':
		return Removed
	default:
		return Unchanged
	}
}

//
// Determine from a HowChanged (Added, Removed, Unchanged) and a
// changed line the nature of `WhatChanged`
//
func whatChanged(line string, how HowChanged) (WhatChanged, string, string) {
	if match := unassignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return UnassignedTask, match[1], ""
	} else if match := assignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return AssignedTask, match[1], ""
	} else if match := finishedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return FinishedTask, match[1], ""
	} else if match := liveWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		if how == Removed {
			return DeadWorker, match[1], ""
		} else {
			return LiveWorker, match[1], ""
		}
	} else if match := completedTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		if how == Added {
			return CompletedTaskByWorker, match[1], match[2]
		} else {
			log.Printf("[workstealer] Warning: got non-added work in Worker outbox: %v %s\n", how, line)
		}
	}

	return Nothing, "", ""
}

//
// A Task that was completed by a given Worker
//
type CompletedTask struct {
	worker string
	task string
}

//
// We will be passed a stream of diffs
//
func parseUpdatesFromStdin() ([]string, []string, []string, []string, []string, []CompletedTask) {
	scanner := bufio.NewScanner(os.Stdin)

	unassignedTasks := []string{}
	assignedTasks := []string{}
	finishedTasks := []string{}
	liveWorkers := []string{}
	deadWorkers := []string{}
	completedTasks := []CompletedTask{}
	
	for scanner.Scan() {
		line := scanner.Text()
		how := howChanged(line[0])
		what, thing, thing2 := whatChanged(line[1:], how)

		fmt.Fprintf(os.Stderr, "Update how=%v what=%v thing=%s thing2=%v line=%s\n", how, what, thing, thing2, line)

		switch what {
		case UnassignedTask:
			unassignedTasks = append(unassignedTasks, thing)
		case AssignedTask:
			assignedTasks = append(assignedTasks, thing)
		case FinishedTask:
			finishedTasks= append(finishedTasks, thing)
		case LiveWorker:
			liveWorkers = append(liveWorkers, thing)
		case DeadWorker:
			deadWorkers = append(deadWorkers, thing)
		case CompletedTaskByWorker:
			completedTasks = append(completedTasks, CompletedTask{thing, thing2})
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("[workerstealer] Error parsing model from stdin: %v\n", err)
	}

	return unassignedTasks, assignedTasks, finishedTasks, liveWorkers, deadWorkers, completedTasks
}

//
// Pick a good worker to assign work to. For now, this is
// random. TODO: be intelligent about distributing load.
//
func pickAWorker(liveWorkers []string) string {
	nWorkers := len(liveWorkers)
	if nWorkers == 0 {
		return ""
	} else {
		return liveWorkers[rand.Intn(nWorkers)]
	}
}

//
// Assign a Task to a Worker
//
func Lock(task string, worker string) {
	lockMarker := filepath.Join(assigned, task)
	if err := os.MkdirAll(assigned, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create assigned directory: %v\n", err)
	} else if err := os.WriteFile(lockMarker, []byte(worker), 0644); err != nil {
		log.Fatalf("[workstealer] Failed to touch lock marker: %v\n", err)
	} else {
		reportChangedFile(lockMarker)
	}
}

//
// Unassign a Task to a Worker
//
func Unlock(task string) {
	lockMarker := filepath.Join(assigned, task)
	if err := os.Remove(lockMarker); err != nil {
		log.Fatalf("[workstealer] Failed to remove lock marker: %v\n", err)
	} else {
		reportChangedFile(lockMarker)
	}
}

//
// A Task has been fully completed by a Worker
//
func MarkDone(task string) {
	finishedMarker := filepath.Join(finished, task)
	if err := os.MkdirAll(finished, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create finished directory: %v\n", err)
	} else if err := os.WriteFile(finishedMarker, []byte{}, 0644); err != nil {
		log.Fatalf("[workstealer] Failed to touch finished marker: %v\n", err)
	} else {
		reportChangedFile(finishedMarker)
	}
}

//
// Utility function to copy src file to dst file
//
func Copy(src string, dst string) error {
	from, err := os.Open(src)
	if err != nil {
		return err
	}
	defer from.Close()

	to, err := os.OpenFile(dst, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		return err
	}
	defer to.Close()

	if _, err = io.Copy(to, from); err != nil {
		return err
	}

	return nil
}

//
// As part of assigning a Task to a Worker, we will move the Task to its Inbox
//
func MoveToWorkerInbox(task string, worker string) {
	unassignedFilePath := filepath.Join(inbox, task)
	workerInboxFilePath := filepath.Join(queues, worker, "inbox", task)

	if err := Copy(unassignedFilePath, workerInboxFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to copy task=%s to worker inbox unassignedFilePath=%s workerInboxFilePath=%s: %v\n", task, unassignedFilePath, workerInboxFilePath, err)
	} else {
		reportChangedFile(workerInboxFilePath)
	}
}

//
// Indicate that we are not yet ready to process this Task,
// e.g. because there are no LiveWorkers
//
func IgnoreTaskForNow(task string) {
	fmt.Fprintf(os.Stderr, "[workstealer] Ignoring unassigned task for now: %s\n", task)
	unassignedFilePath := filepath.Join(inbox, task)
	if err := os.Remove(unassignedFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to remove task from unassigned: %v\n", err)
	}
}

//
// As part of finishing up a Task, move it from the Worker's Outbox to the final Outbox
//
func MoveToFinalOutbox(task string, worker string) {
	fileInWorkerOutbox := filepath.Join(worker, "outbox", task)
	fullyDoneOutputFilePath := filepath.Join(outbox, task)

	if err := os.MkdirAll(outbox, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create outbox directory: %v\n", err)
	} else if err := os.Rename(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to copy output to final outbox: %v\n", err)
	} else {
		reportChangedFile(fullyDoneOutputFilePath)
	}
}

//
// Assign an unassigned Task to one of the given LiveWorkers
//
func AssignNewTask(task string, liveWorkers []string) {
	worker := pickAWorker(liveWorkers)
	if worker != "" {
		Lock(task, worker)
		MoveToWorkerInbox(task, worker)
	} else {
		IgnoreTaskForNow(task)
	}
}

//
// A Worker has transitioned from Live to Dead. Reassign its Tasks.
//
func CleanupForDeadWorker(worker string, liveWorkers []string) {
	// TODO
}

//
// A Task has completed
//
func CleanupForCompletedTask(completedTask CompletedTask) {
	MarkDone(completedTask.task)
	MoveToFinalOutbox(completedTask.task, completedTask.worker)
}

//
// Assumed to be called every time something has changed in the
// `queue` directory. This will emit to stdout a newline-separated
// stream of filepaths, one per file that it has changed in some way.
//
func main() {
	fmt.Fprintf(os.Stderr, "[workstealer] Starting with inbox=%s outbox=%s queues=%s\n", inbox, outbox, queues)

	unassignedTasks, assignedTasks, finishedTasks, liveWorkers, deadWorkers, completedTasks := parseUpdatesFromStdin()

	reportUnassigned(len(unassignedTasks)-len(assignedTasks))
	reportAssigned(len(assignedTasks))
	reportDone(len(finishedTasks))
	reportLiveWorkers(len(liveWorkers))

	for _, task := range unassignedTasks {
		AssignNewTask(task, liveWorkers)
	}

	for _, worker := range deadWorkers {
		CleanupForDeadWorker(worker, liveWorkers)
	}

	for _, completedTask := range completedTasks {
		CleanupForCompletedTask(completedTask)
	}
}
