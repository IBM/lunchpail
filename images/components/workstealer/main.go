package main

import (
	"bufio"
	"cmp"
	"fmt"
	"log"
	"os"
	"github.com/dustin/go-humanize/english"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"text/tabwriter"
	"time"
)

// We want to identify four classes of changes:
//
// 1. Unassigned/Assigned/Finished Tasks, indicated by any new files in inbox/assigned/finished
// 2. LiveWorkers, indicated by new .alive file in queues/{workerId}/inbox/.alive
// 3. DeadWorkers, indicated by deletion of .alive files
// 4. AssignedTaskByWorker, indicated by any new files in queues/{workerId}/inbox
// 5. ProcessingTaskByWorker, indicated by any new files in queues/{workerId}/processing
// 6. SuccessfulTaskByWorker, indicated by any new files in queues/{workerId}/outbox.succeeded
// 6. FailedTaskByWorker, indicated by any new files in queues/{workerId}/outbox.failed
type HowChanged int

const (
	Added HowChanged = iota
	Removed
	Unchanged
)

type WhatChanged int

const (
	UnassignedTask WhatChanged = iota
	DispatcherDone
	FinishedTask

	LiveWorker
	DeadWorker

	KillFileForWorker
	AssignedTaskByWorker
	ProcessingTaskByWorker
	SuccessfulTaskByWorker
	FailedTaskByWorker

	Nothing
)

// A Task that was assigned to a given Worker
type AssignedTask struct {
	worker string
	task   string
}

type Worker struct {
	alive           bool
	nSuccess        uint
	nFail           uint
	name            string
	assignedTasks   []string
	processingTasks []string
	killfilePresent bool
}

type TaskCode string

const (
	succeeded TaskCode = "succeeded"
	failed    TaskCode = "failed"
)

// The current state of the world
type Model struct {
	// has dispatcher dropped its donefile, indicating no more
	// work is forthcoming?
	DispatcherDone bool

	UnassignedTasks []string
	FinishedTasks   []string
	LiveWorkers     []Worker
	DeadWorkers     []Worker

	AssignedTasks   []AssignedTask
	ProcessingTasks []AssignedTask

	SuccessfulTasks []AssignedTask
	FailedTasks     []AssignedTask
}

func (model *Model) nFinishedTasks() int {
	return len(model.FinishedTasks)
}

func (model *Model) nUnassignedTasks() int {
	return len(model.UnassignedTasks)
}

func (model *Model) nAssignedTasks() int {
	return len(model.AssignedTasks)
}

// How many outstanding tasks do we have, i.e. either Unassigned, or
// Assigned.
func (model *Model) nTasksRemaining() int {
	return model.nUnassignedTasks() + model.nAssignedTasks()
}

var run = os.Getenv("RUN_NAME")
var queue = os.Getenv("QUEUE")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

var unassignedTaskPattern = regexp.MustCompile("^inbox/(.+)$")
var dispatcherDonePattern = regexp.MustCompile("^done$")
var finishedTaskPattern = regexp.MustCompile("^finished/(.+)$")
var liveWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]alive$")
var deadWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]dead$")
var killfilePattern = regexp.MustCompile("^queues/(.+)/kill$")
var assignedTaskPattern = regexp.MustCompile("^queues/(.+)/inbox/(.+)$")
var processingTaskPattern = regexp.MustCompile("^queues/(.+)/processing/(.+)$")
var completedTaskPattern = regexp.MustCompile("^queues/(.+)/outbox/(.+)[.](succeeded|failed)$")

var writer = tabwriter.NewWriter(os.Stderr, 0, 8, 1, '\t', tabwriter.AlignRight)

// Emit the path to the file we linked
func reportLinkedFile(src, dst string) {
	fmt.Printf("%s %s link\n", src, dst)
}

// Emit the path to the file we deleted
func reportMovedFile(src, dst string) {
	fmt.Printf("%s %s move\n", src, dst)
}

// Emit the path to the file we changed
func reportChangedFile(filepath string) {
	fmt.Printf("%s\n", filepath)
}

// Emit that we are ready to terminate
func bye() {
	fmt.Println("bye")
}

// Record the current state of Model for observability
func reportState(model Model) {
	now := time.Now()

	fmt.Fprintf(writer, "lunchpail.io\tunassigned\t%d\t\t\t\t\t%s\t%s\n", len(model.UnassignedTasks), run, now.Format(time.UnixDate))
	fmt.Fprintf(writer, "lunchpail.io\tdispatcherDone\t%v\t\t\t\t\t%s\n", model.DispatcherDone, run)
	fmt.Fprintf(writer, "lunchpail.io\tassigned\t%d\t\t\t\t\t%s\n", len(model.AssignedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tprocessing\t\t%d\t\t\t\t%s\n", len(model.ProcessingTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tdone\t\t\t%d\t%d\t\t%s\n", len(model.SuccessfulTasks), len(model.FailedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tliveworkers\t%d\t\t\t\t\t%s\n", len(model.LiveWorkers), run)
	fmt.Fprintf(writer, "lunchpail.io\tdeadworkers\t%d\t\t\t\t\t%s\n", len(model.DeadWorkers), run)

	for _, worker := range model.LiveWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tliveworker\t%d\t%d\t%d\t%d\t%s\t%s\t%v\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run, worker.killfilePresent,
		)
	}
	for _, worker := range model.DeadWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tdeadworker\t%d\t%d\t%d\t%d\t%s\t%s\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run,
		)
	}
	fmt.Fprintf(writer, "lunchpail.io\t---\n")

	writer.Flush()
}

// Determine from a diff the `HowChanged` property
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

// Determine from a HowChanged (Added, Removed, Unchanged) and a
// changed line the nature of `WhatChanged`
func whatChanged(line string) (WhatChanged, string, string) {
	if match := unassignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return UnassignedTask, match[1], ""
	} else if match := dispatcherDonePattern.FindStringSubmatch(line); len(match) == 1 {
		return DispatcherDone, "", ""
	} else if match := finishedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return FinishedTask, match[1], ""
	} else if match := liveWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return LiveWorker, match[1], ""
	} else if match := deadWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return DeadWorker, match[1], ""
	} else if match := killfilePattern.FindStringSubmatch(line); len(match) == 2 {
		return KillFileForWorker, match[1], ""
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

// We will be passed a stream of diffs
func parseUpdatesFromStdin() Model {
	scanner := bufio.NewScanner(os.Stdin)

	unassignedTasks := []string{}
	dispatcherDone := false
	finishedTasks := []string{}
	assignedTasks := []AssignedTask{}
	processingTasks := []AssignedTask{}
	successfulTasks := []AssignedTask{}
	failedTasks := []AssignedTask{}

	workersLookup := make(map[string]Worker)

	for scanner.Scan() {
		line := scanner.Text()
		how := howChanged(line[0])

		if how == Removed {
			// nice to know, but we only need to
			// incorporate extant files, not removed files
			continue
		}

		what, thing, thing2 := whatChanged(line[1:])

		switch what {
		case UnassignedTask:
			unassignedTasks = append(unassignedTasks, thing)
		case DispatcherDone:
			dispatcherDone = true
		case FinishedTask:
			finishedTasks = append(finishedTasks, thing)
		case LiveWorker:
			worker := Worker{true, 0, 0, thing, []string{}, []string{}, false}
			workersLookup[thing] = worker
		case DeadWorker:
			worker := Worker{false, 0, 0, thing, []string{}, []string{}, false}
			workersLookup[thing] = worker
		case KillFileForWorker:
			// thing is worker name
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, worker.assignedTasks, worker.processingTasks, true}
			} else {
				fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
			}
		case AssignedTaskByWorker:
			// thing is worker name, thing2 is task name
			assignedTasks = append(assignedTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, append(worker.assignedTasks, thing2), worker.processingTasks, worker.killfilePresent}
			} else {
				fmt.Fprintf(os.Stderr, "ERROR Unable to find worker=%s\n", thing)
			}
		case ProcessingTaskByWorker:
			// thing is worker name, thing2 is task name
			processingTasks = append(processingTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, worker.assignedTasks, append(worker.processingTasks, thing2), worker.killfilePresent}
			} else {
				fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
			}
		case SuccessfulTaskByWorker:
			// thing is worker name, thing2 is task name
			successfulTasks = append(successfulTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess + 1, worker.nFail, worker.name, worker.assignedTasks, worker.processingTasks, worker.killfilePresent}
			} else {
				fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
			}

		case FailedTaskByWorker:
			// thing is worker name, thing2 is task name
			failedTasks = append(failedTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail + 1, worker.name, worker.assignedTasks, worker.processingTasks, worker.killfilePresent}
			} else {
				fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("ERROR parsing model from stdin: %v\n", err)
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

	return Model{dispatcherDone, unassignedTasks, finishedTasks, liveWorkers, deadWorkers, assignedTasks, processingTasks, successfulTasks, failedTasks}
}

// Return a model of the world
func ParseUpdates() Model {
	return parseUpdatesFromStdin()
}

// A Task has been fully completed by a Worker
func MarkDone(task string) {
	finishedMarker := filepath.Join(finished, task)
	if err := os.MkdirAll(finished, 0700); err != nil {
		log.Fatalf("ERROR failed to create finished directory: %v\n", err)
	} else if err := os.WriteFile(finishedMarker, []byte{}, 0644); err != nil {
		log.Fatalf("ERROR failed to touch finished marker: %v\n", err)
	} else {
		reportChangedFile(finishedMarker)
	}
}

// Touch killfile for the given Worker
func TouchKillFile(worker Worker) {
	workerKillFileFilePath := filepath.Join(queues, worker.name, "kill")
	if err := os.WriteFile(workerKillFileFilePath, []byte{}, 0644); err != nil {
		log.Fatalf("ERROR failed to touch killfile: %v\n", err)
	} else {
		reportChangedFile(workerKillFileFilePath)
	}
}

// As part of assigning a Task to a Worker, we will move the Task to its Inbox
func MoveToWorkerInbox(task string, worker Worker) {
	unassignedFilePath := filepath.Join(inbox, task)
	workerInboxFilePath := filepath.Join(queues, worker.name, "inbox", task)

	if err := os.Rename(unassignedFilePath, workerInboxFilePath); err != nil {
		log.Fatalf("ERROR failed to move task=%s to worker inbox unassignedFilePath=%s workerInboxFilePath=%s: %v\n", task, unassignedFilePath, workerInboxFilePath, err)
	} else {
		reportMovedFile(unassignedFilePath, workerInboxFilePath)
	}
}

// As part of finishing up a Task, copy it from the Worker's Outbox to the final Outbox
func CopyToFinalOutbox(task string, worker string, success TaskCode) {
	fileInWorkerOutbox := filepath.Join(queues, worker, "outbox", task)
	fullyDoneOutputFilePath := filepath.Join(outbox, task)

	codeFileInWorkerOutbox := fileInWorkerOutbox + ".code"
	fullyDoneCodeFilePath := fullyDoneOutputFilePath + ".code"

	stdoutFileInWorkerOutbox := fileInWorkerOutbox + ".stdout"
	fullyDoneStdoutFilePath := fullyDoneOutputFilePath + ".stdout"

	stderrFileInWorkerOutbox := fileInWorkerOutbox + ".stderr"
	fullyDoneStderrFilePath := fullyDoneOutputFilePath + ".stderr"

	successFileInWorkerOutbox := fileInWorkerOutbox + "." + string(success)
	fullyDoneSuccessFilePath := fullyDoneOutputFilePath + "." + string(success)

	if err := os.MkdirAll(outbox, 0700); err != nil {
		log.Fatalf("ERROR failed to create outbox directory: %v\n", err)
	} else {
		if err := os.Link(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			log.Fatalf("ERROR failed to link output to final outbox: %v\n", err)
		} else {
			reportLinkedFile(fileInWorkerOutbox, fullyDoneOutputFilePath)
		}

		if err := os.Link(codeFileInWorkerOutbox, fullyDoneCodeFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			log.Fatalf("ERROR failed to link code to final outbox: %v\n", err)
		} else {
			reportLinkedFile(codeFileInWorkerOutbox, fullyDoneCodeFilePath)
		}

		if err := os.Link(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			log.Fatalf("ERROR failed to link stdout to final outbox: %v\n", err)
		} else {
			reportLinkedFile(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath)
		}

		if err := os.Link(stderrFileInWorkerOutbox, fullyDoneStderrFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			log.Fatalf("ERROR failed to link stderr to final outbox: %v\n", err)
		} else {
			reportLinkedFile(stderrFileInWorkerOutbox, fullyDoneStderrFilePath)
		}

		if err := os.Link(successFileInWorkerOutbox, fullyDoneSuccessFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			log.Fatalf("ERROR failed to link success to final outbox: %v\n", err)
		} else {
			reportLinkedFile(successFileInWorkerOutbox, fullyDoneSuccessFilePath)
		}
	}
}

// Assign an unassigned Task to one of the given LiveWorkers
func AssignNewTaskToWorker(task string, worker Worker) {
	fmt.Fprintf(os.Stderr, "DEBUG Assigning task=%s to worker=%s \n", task, worker.name)
	MoveToWorkerInbox(task, worker)
}

type Box string

const (
	Inbox      = "inbox"
	Processing = "processing"
	Outbox     = "outbox"
)

// A Worker has died. Unassign this task that it owns
func moveTaskBackToUnassigned(task string, worker Worker, box Box) {
	inWorkerFilePath := filepath.Join(queues, worker.name, string(box), task)
	unassignedFilePath := filepath.Join(inbox, task)

	if err := os.MkdirAll(inbox, 0700); err != nil {
		log.Fatalf("ERROR failed to create inbox directory: %v\n", err)
	} else if err := os.Rename(inWorkerFilePath, unassignedFilePath); err != nil {
		log.Fatalf("ERROR failed to move assigned task back to unassigned: %v\n", err)
	} else {
		reportMovedFile(inWorkerFilePath, unassignedFilePath)
	}
}

// A Worker has transitioned from Live to Dead. Reassign its Tasks.
func CleanupForDeadWorker(worker Worker) {
	nAssigned := len(worker.assignedTasks)
	nProcessing := len(worker.processingTasks)

	if nAssigned + nProcessing > 0 {
		fmt.Fprintf(
			os.Stderr,
			"INFO Reassigning dead worker tasks (it had %s assigned and was processing %s)\n",
			english.Plural(nAssigned, "task", ""),
			english.Plural(nProcessing, "task", ""),
		)
	}

	for _, assignedTask := range worker.assignedTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "inbox")
	}
	for _, assignedTask := range worker.processingTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "processing")
	}
}

// A Task has completed
func CleanupForCompletedTask(completedTask AssignedTask, success TaskCode) {
	MarkDone(completedTask.task)
	CopyToFinalOutbox(completedTask.task, completedTask.worker, success)
}

type Apportionment struct {
	startIdx int
	endIdx   int
	worker   Worker
}

func apportion(model Model) []Apportionment {
	As := []Apportionment{}

	if len(model.LiveWorkers) == 0 || len(model.UnassignedTasks) == 0 {
		// nothing to do: either no live workers or no unassigned tasks
		return As
	}

	desiredLevel := max(1, len(model.UnassignedTasks)/len(model.LiveWorkers))

	fmt.Fprintf(
		os.Stderr,
		"DEBUG Allocating %s to %s. Seeking %s per worker.\n",
		english.Plural(len(model.UnassignedTasks), "task", ""),
		english.Plural(len(model.LiveWorkers), "worker", ""),
		english.Plural(desiredLevel, "task", ""),
	)

	startIdx := 0
	for _, worker := range model.LiveWorkers {
		if startIdx >= len(model.UnassignedTasks) {
			break
		}

		assignThisMany := max(0, desiredLevel-len(worker.assignedTasks))

		if assignThisMany > 0 {
			endIdx := startIdx + assignThisMany
			As = append(As, Apportionment{startIdx, endIdx, worker})
			startIdx = endIdx
		}
	}

	return As
}

func assignNewTasks(model Model) {
	for _, A := range apportion(model) {
		nTasks := A.endIdx-A.startIdx
		fmt.Fprintf(os.Stderr, "INFO Assigning %s to %s\n", english.Plural(nTasks, "task", ""), strings.Replace(A.worker.name, run + "-", "", 1))
		for idx := range nTasks {
			task := model.UnassignedTasks[A.startIdx+idx]
			AssignNewTaskToWorker(task, A.worker)
		}
	}
}

// Handle dead Workers
func reassignDeadWorkerTasks(model Model) {
	for _, worker := range model.DeadWorkers {
		CleanupForDeadWorker(worker)
	}
}

// Handle completed Tasks
func cleanupCompletedTasks(model Model) {
	for _, completedTask := range model.SuccessfulTasks {
		CleanupForCompletedTask(completedTask, "succeeded")
	}
	for _, completedTask := range model.FailedTasks {
		CleanupForCompletedTask(completedTask, "failed")
	}
}

// See if we need to rebalance workloads
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
			if len(worker.assignedTasks) == 0 && len(worker.processingTasks) == 0 {
				workersWithoutWork = append(workersWithoutWork, worker)
			} else {
				workersWithWork = append(workersWithWork, worker)
			}
		}

		if len(workersWithWork) > 0 && len(workersWithoutWork) > 0 {
			// Then we can shift load from those with to
			// those without!
			desiredLevel := max(1, (len(model.AssignedTasks)+len(model.ProcessingTasks))/len(model.LiveWorkers))
			stoleSomeTasks := false

			// then we can steal at least one Task
			for _, workerWithWork := range workersWithWork {
				if stealThisMany := max(0, len(workerWithWork.assignedTasks)-desiredLevel); stealThisMany > 0 {
					stoleSomeTasks = true
					fmt.Fprintf(
						os.Stderr,
						"INFO Stealing %s from %s\n",
						english.Plural(stealThisMany, "task", ""),
						workerWithWork.name,
					)

					for i := range stealThisMany {
						j := len(workerWithWork.assignedTasks) - i - 1
						taskToSteal := workerWithWork.assignedTasks[j]
						moveTaskBackToUnassigned(taskToSteal, workerWithWork, "inbox")
					}
				}
			}

			// Indicate whether we did any rebalancing
			return stoleSomeTasks
		}
	}

	// Indicate that we didn't rebalance
	return false
}

// If the dispatcher is done and there are no more outstanding tasks,
// then touch kill files in the worker inboxes.
func touchKillFiles(model Model) {
	if model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0 {
		for _, worker := range model.LiveWorkers {
			if !worker.killfilePresent {
				TouchKillFile(worker)
			}
		}
	}
}

func readyToBye(model Model) bool {
	return model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0 && len(model.LiveWorkers) == 0
}

// Assumed to be called every time something has changed in the
// `queue` directory. This will emit to stdout a newline-separated
// stream of filepaths, one per file that it has changed in some way.
func main() {
	// fmt.Fprintf(os.Stderr, "INFO Starting with inbox=%s outbox=%s queues=%s\n", inbox, outbox, queues)
	model := ParseUpdates()
	reportState(model)

	if readyToBye(model) {
		fmt.Fprintln(os.Stderr, "INFO All work has been completed, all workers have terminated")
		bye()
	} else if !rebalance(model) {
		assignNewTasks(model)
		touchKillFiles(model)
		reassignDeadWorkerTasks(model)
		cleanupCompletedTasks(model)
	}
}
