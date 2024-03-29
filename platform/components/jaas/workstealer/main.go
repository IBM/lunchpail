package main

import (
	"os"
	"cmp"
	"fmt"
	"log"
	"slices"
	"time"
	"bufio"
	"regexp"
	"path/filepath"
	"text/tabwriter"
)

//
// We want to identify four classes of changes:
//
// 1. Unassigned/Assigned/Finished Tasks, indicated by any new files in inbox/assigned/finished
// 2. LiveWorkers, indicated by new .alive file in queues/{workerId}/inbox/.alive
// 3. DeadWorkers, indicated by deletion of .alive files
// 4. AssignedTaskByWorker, indicated by any new files in queues/{workerId}/inbox
// 5. ProcessingTaskByWorker, indicated by any new files in queues/{workerId}/processing
// 6. SuccessfulTaskByWorker, indicated by any new files in queues/{workerId}/outbox.succeeded
// 6. FailedTaskByWorker, indicated by any new files in queues/{workerId}/outbox.failed
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
	FinishedTask

	LiveWorker
	DeadWorker

	AssignedTaskByWorker
	ProcessingTaskByWorker
	SuccessfulTaskByWorker
	FailedTaskByWorker

	Nothing
)

//
// A Task that was assigned to a given Worker
//
type AssignedTask struct {
	worker string
	task string
}

type Worker struct {
	alive bool
	nSuccess uint
	nFail uint
	name string
	assignedTasks []string
	processingTasks []string
}

//
// The current state of the world
//
type Model struct {
	UnassignedTasks []string
	FinishedTasks []string
	LiveWorkers []Worker
	DeadWorkers []Worker

	AssignedTasks []AssignedTask
	ProcessingTasks []AssignedTask

	SuccessfulTasks []AssignedTask
	FailedTasks []AssignedTask
}

var run = os.Getenv("RUN_NAME")
var queue = os.Getenv("QUEUE")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

var unassignedTaskPattern = regexp.MustCompile("^inbox/(.+)$")
var finishedTaskPattern = regexp.MustCompile("^finished/(.+)$")
var liveWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]alive$")
var deadWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]dead$")
var assignedTaskPattern = regexp.MustCompile("^queues/(.+)/inbox/(.+)$")
var processingTaskPattern = regexp.MustCompile("^queues/(.+)/processing/(.+)$")
var completedTaskPattern = regexp.MustCompile("^queues/(.+)/outbox/(.+)[.](succeeded|failed)$")

var writer = tabwriter.NewWriter(os.Stderr, 0, 8, 1, '\t', tabwriter.AlignRight)

//
// Emit the path to the file we deleted
//
func reportMovedFile(src, dst string) {
	fmt.Printf("%s %s move\n", src, dst)
}

//
// Emit the path to the file we changed
//
func reportChangedFile(filepath string) {
	fmt.Printf("%s\n", filepath)
}

//
// Record the current state of Model for observability
//
func reportState(model Model) {
	now := time.Now()

	fmt.Fprintf(writer, "lunchpail.io\tunassigned\t%d\t\t\t\t\t%s\t%s\n", len(model.UnassignedTasks), run, now.Format(time.UnixDate))
	fmt.Fprintf(writer, "lunchpail.io\tassigned\t%d\t\t\t\t\t%s\n", len(model.AssignedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tprocessing\t\t%d\t\t\t\t%s\n", len(model.ProcessingTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tdone\t\t\t%d\t%d\t\t%s\n", len(model.SuccessfulTasks), len(model.FailedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tliveworkers\t%d\t\t\t\t\t%s\n", len(model.LiveWorkers), run)
	fmt.Fprintf(writer, "lunchpail.io\tdeadworkers\t%d\t\t\t\t\t%s\n", len(model.DeadWorkers), run)

	for _, worker := range model.LiveWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tliveworker\t%d\t%d\t%d\t%d\t%s\t%s\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run,
		)
	}
	for _, worker := range model.DeadWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tdeadworker\t%d\t%d\t%d\t%d\t%s\t%s\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run,
		)
	}

	writer.Flush()
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
func whatChanged(line string) (WhatChanged, string, string) {
	if match := unassignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return UnassignedTask, match[1], ""
	} else if match := finishedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return FinishedTask, match[1], ""
	} else if match := liveWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return LiveWorker, match[1], ""
	} else if match := deadWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return DeadWorker, match[1], ""
	} else if match := assignedTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return AssignedTaskByWorker, match[1], match[2]
	} else if match := processingTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return ProcessingTaskByWorker, match[1], match[2]
	} else if match := completedTaskPattern.FindStringSubmatch(line); len(match) == 4 {
		if match[3] == "succeeded" {
			return SuccessfulTaskByWorker, match[1], match[2]
		} else {
			return FailedTaskByWorker, match[1], match[2]
		}
	}

	return Nothing, "", ""
}

//
// We will be passed a stream of diffs
//
func parseUpdatesFromStdin() Model {
	scanner := bufio.NewScanner(os.Stdin)

	unassignedTasks := []string{}
	finishedTasks := []string{}
	assignedTasks := []AssignedTask{}
	processingTasks := []AssignedTask{}
	successfulTasks := []AssignedTask{}
	failedTasks := []AssignedTask{}

	workersLookup := make(map[string]Worker)

	for scanner.Scan() {
		line := scanner.Text()
		how := howChanged(line[0])
		what, thing, thing2 := whatChanged(line[1:])

		fmt.Fprintf(os.Stderr, "[workstealer] Update how=%v what=%v thing=%s thing2=%v line=%s\n", how, what, thing, thing2, line)

		switch what {
		case UnassignedTask:
			unassignedTasks = append(unassignedTasks, thing)
		case FinishedTask:
			finishedTasks= append(finishedTasks, thing)
		case LiveWorker:
			worker := Worker{true, 0, 0, thing, []string{}, []string{}}
			workersLookup[thing] = worker
		case DeadWorker:
			worker := Worker{false, 0, 0, thing, []string{}, []string{}}
			workersLookup[thing] = worker
		case AssignedTaskByWorker:
			// thing is worker name, thing2 is task name
			assignedTasks = append(assignedTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, append(worker.assignedTasks, thing2), worker.processingTasks}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}
		case ProcessingTaskByWorker:
			// thing is worker name, thing2 is task name
			processingTasks = append(processingTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, worker.assignedTasks, append(worker.processingTasks, thing2)}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}
		case SuccessfulTaskByWorker:
			// thing is worker name, thing2 is task name
			successfulTasks = append(successfulTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess + 1, worker.nFail, worker.name, worker.assignedTasks, worker.processingTasks}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}

		case FailedTaskByWorker:
			// thing is worker name, thing2 is task name
			failedTasks = append(failedTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail + 1, worker.name, worker.assignedTasks, worker.processingTasks}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("[workerstealer] Error parsing model from stdin: %v\n", err)
	}

	liveWorkers := []Worker{}
	deadWorkers := []Worker{}
	for _, worker := range workersLookup {
		if worker.alive {
			liveWorkers = append(liveWorkers, worker)
		} else {
			deadWorkers = append(deadWorkers, worker)
		}
	}

	slices.SortFunc(liveWorkers, func(a, b Worker) int {
		return cmp.Compare(a.name, b.name)
	})
	slices.SortFunc(deadWorkers, func(a, b Worker) int {
		return cmp.Compare(a.name, b.name)
	})

	return Model{unassignedTasks, finishedTasks, liveWorkers, deadWorkers, assignedTasks, processingTasks, successfulTasks, failedTasks}
}

//
// Return a model of the world
//
func ParseUpdates() Model {
	return parseUpdatesFromStdin()
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
// As part of assigning a Task to a Worker, we will move the Task to its Inbox
//
func MoveToWorkerInbox(task string, worker Worker) {
	unassignedFilePath := filepath.Join(inbox, task)
	workerInboxFilePath := filepath.Join(queues, worker.name, "inbox", task)

	if err := os.Rename(unassignedFilePath, workerInboxFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to move task=%s to worker inbox unassignedFilePath=%s workerInboxFilePath=%s: %v\n", task, unassignedFilePath, workerInboxFilePath, err)
	} else {
		reportMovedFile(unassignedFilePath, workerInboxFilePath)
	}
}

//
// As part of finishing up a Task, move it from the Worker's Outbox to the final Outbox
//
func MoveToFinalOutbox(task string, worker string) {
	fileInWorkerOutbox := filepath.Join(queues, worker, "outbox", task)
	fullyDoneOutputFilePath := filepath.Join(outbox, task)

	codeFileInWorkerOutbox := fileInWorkerOutbox + ".code"
	fullyDoneCodeFilePath := fullyDoneOutputFilePath + ".code"

	stdoutFileInWorkerOutbox := fileInWorkerOutbox + ".stdout"
	fullyDoneStdoutFilePath := fullyDoneOutputFilePath + ".stdout"

	stderrFileInWorkerOutbox := fileInWorkerOutbox + ".stderr"
	fullyDoneStderrFilePath := fullyDoneOutputFilePath + ".stderr"

	if err := os.MkdirAll(outbox, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create outbox directory: %v\n", err)
	} else {
		if err := os.Rename(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil {
			log.Fatalf("[workstealer] Failed to move output to final outbox: %v\n", err)
		} else {
			reportMovedFile(fileInWorkerOutbox, fullyDoneOutputFilePath)
		}

		if err := os.Rename(codeFileInWorkerOutbox, fullyDoneCodeFilePath); err != nil {
			log.Fatalf("[workstealer] Failed to move code to final outbox: %v\n", err)
		} else {
			reportMovedFile(codeFileInWorkerOutbox, fullyDoneCodeFilePath)
		}

		if err := os.Rename(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath); err != nil {
			log.Fatalf("[workstealer] Failed to move stdout to final outbox: %v\n", err)
		} else {
			reportMovedFile(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath)
		}

		if err := os.Rename(stderrFileInWorkerOutbox, fullyDoneStderrFilePath); err != nil {
			log.Fatalf("[workstealer] Failed to move stderr to final outbox: %v\n", err)
		} else {
			reportMovedFile(stderrFileInWorkerOutbox, fullyDoneStderrFilePath)
		}			
	}
}

//
// Assign an unassigned Task to one of the given LiveWorkers
//
func AssignNewTaskToWorker(task string, worker Worker) {
	fmt.Fprintf(os.Stderr, "[workstealer] Assigning to worker=%s task=%s\n", worker.name, task)
	MoveToWorkerInbox(task, worker)
}

type Box string
const (
	Inbox = "inbox"
	Processing = "processing"
	Outbox = "outbox"
)

//
// A Worker has died. Unassign this task that it owns
//
func moveTaskBackToUnassigned(task string, worker Worker, box Box) {
	inWorkerFilePath := filepath.Join(queues, worker.name, string(box), task)
	unassignedFilePath := filepath.Join(inbox, task)

	if err := os.MkdirAll(inbox, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create inbox directory: %v\n", err)
	} else if err := os.Rename(inWorkerFilePath, unassignedFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to move assigned task back to unassigned: %v\n", err)
	} else {
		reportMovedFile(inWorkerFilePath, unassignedFilePath)
	}
}

//
// A Worker has transitioned from Live to Dead. Reassign its Tasks.
//
func CleanupForDeadWorker(worker Worker) {
	for _, assignedTask := range worker.assignedTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "inbox")
	}
	for _, assignedTask := range worker.processingTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "processing")
	}
}

//
// A Task has completed
//
func CleanupForCompletedTask(completedTask AssignedTask) {
	MarkDone(completedTask.task)
	MoveToFinalOutbox(completedTask.task, completedTask.worker)
}

type Apportionment struct {
	startIdx int
	endIdx int
	worker Worker
}

func apportion(model Model) []Apportionment {
	As := []Apportionment{}
	desiredLevel := max(1, len(model.UnassignedTasks) / len(model.LiveWorkers))

	nUnderutilizedWorkers := 0
	for _, worker := range model.LiveWorkers {
		assignThisMany := max(0, desiredLevel - len(worker.assignedTasks))
		if assignThisMany > 0 {
			nUnderutilizedWorkers++
		}
	}

	if nUnderutilizedWorkers > 0 {
		startIdx := 0
		desiredLevel = max(1, len(model.UnassignedTasks) / nUnderutilizedWorkers)
		fmt.Fprintf(
			os.Stderr,
			"[workstealer] Apportionment desiredLevel=%d nUnassigned=%d nLiveWorkers=%d\n",
			desiredLevel,
			len(model.UnassignedTasks),
			len(model.LiveWorkers),
		)
		for _, worker := range model.LiveWorkers {
			if startIdx >= len(model.UnassignedTasks) {
				break
			}

			assignThisMany := max(0, desiredLevel - len(worker.assignedTasks))
			endIdx := startIdx + assignThisMany
			As = append(As, Apportionment{startIdx, endIdx, worker})
			startIdx = endIdx
		}
	}

	return As
}
	
func assignNewTasks(model Model) {
	for _, A := range apportion(model) {
		fmt.Fprintf(os.Stderr, "[workstealer] Assigning to worker=%s startIdx=%d endIdx=%d\n", A.worker.name, A.startIdx, A.endIdx)
		for idx := range A.endIdx - A.startIdx {
			task := model.UnassignedTasks[A.startIdx + idx]
			MoveToWorkerInbox(task, A.worker)
		}
	}
}

//
// Handle dead Workers
//
func reassignDeadWorkerTasks(model Model) {
	for _, worker := range model.DeadWorkers {
		CleanupForDeadWorker(worker)
	}
}

//
// Handle completed Tasks
//
func cleanupCompletedTasks(model Model) {
	for _, completedTask := range model.SuccessfulTasks {
		CleanupForCompletedTask(completedTask)
	}
	for _, completedTask := range model.FailedTasks {
		CleanupForCompletedTask(completedTask)
	}
}

//
// See if we need to rebalance workloads
//
func rebalance(model Model) bool {
	if len(model.UnassignedTasks) == 0 {
		// If we had some unassigned Tasks, we probably
		// wouldnm't need to rebalance; we could just send
		// those Tasks to the starving Workers. Since we have
		// no unassigned Tasks, we might want to consider
		// reassigning Tasks between Workers.

		// Tally up live Workers with and without work. We aim
		// to shift load from those with to those without.
		workersWithWork := []Worker{}
		workersWithoutWork := []Worker{}
		for _, worker := range model.LiveWorkers {
			if len(worker.assignedTasks) == 0 {
				workersWithoutWork = append(workersWithoutWork, worker)
			} else {
				workersWithWork = append(workersWithWork, worker)
			}
		}

		if len(workersWithWork) > 0 && len(workersWithoutWork) > 0 {
			// Then we can shift load from those with to
			// those without!
			desiredLevel := max(1, (len(model.AssignedTasks) + len(model.ProcessingTasks)) / len(model.LiveWorkers))
			fmt.Fprintf(os.Stderr, "[workstealer] Rebalancing to desiredLevel=%d\n", desiredLevel)

			// then we can steal at least one Task 
			for _, workerWithWork := range workersWithWork {
				stealThisMany := max(0, len(workerWithWork.assignedTasks) - desiredLevel)
				fmt.Fprintf(os.Stderr, "[workstealer] Rebalancer stealing %d tasks from worker=%s\n", stealThisMany, workerWithWork.name)

				for i := range stealThisMany {
					j := len(workerWithWork.assignedTasks) - i - 1
					taskToSteal := workerWithWork.assignedTasks[j]
					moveTaskBackToUnassigned(taskToSteal, workerWithWork, "inbox")
				}
			}

			// Indicate that we did rebalance
			return true
		}
	}

	// Indicate that we didn't rebalance
	return false
}

//
// Assumed to be called every time something has changed in the
// `queue` directory. This will emit to stdout a newline-separated
// stream of filepaths, one per file that it has changed in some way.
//
func main() {
	// fmt.Fprintf(os.Stderr, "[workstealer] Starting with inbox=%s outbox=%s queues=%s\n", inbox, outbox, queues)
	model := ParseUpdates()
	reportState(model)

	if !rebalance(model) {
		assignNewTasks(model)
		reassignDeadWorkerTasks(model)
		cleanupCompletedTasks(model)
	}
}
