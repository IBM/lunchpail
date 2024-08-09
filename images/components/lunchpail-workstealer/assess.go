package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/dustin/go-humanize/english"
)

func (c client) localPathToRemote(path string) string {
	return strings.Replace(path, c.paths.bucket+"/", "", 1)
}

// Emit the path to the file we linked
func (c client) reportLinkedFile(src, dst string) error {
	//return c.reportChangedFile(dst)
	//fmt.Printf("%s %s link\n", src, dst)
	rsrc := c.localPathToRemote(src)
	rdst := c.localPathToRemote(dst)
	return c.s3.copyto(c.paths.bucket, rsrc, rdst)
}

// Emit the path to the file we deleted
func (c client) reportMovedFile(src, dst string) error {
	// fmt.Printf("%s %s move\n", src, dst)
	rsrc := c.localPathToRemote(src)
	rdst := c.localPathToRemote(dst)
	if debug {
		fmt.Fprintf(os.Stderr, "DEBUG Uploading moved file: %s -> %s\n", rsrc, rdst)
	}

	//rclone copyto --retries 20 --retries-sleep=1s $file $remotefile &
	return c.s3.moveto(c.paths.bucket, rsrc, rdst)
}

// Emit the path to the file we changed
func (c client) reportChangedFile(filepath string) error {
	//fmt.Printf("%s\n", filepath)
	remotefile := c.localPathToRemote(filepath)
	if debug {
		fmt.Fprintf(os.Stderr, "DEBUG Uploading changed file: %s -> %s\n", filepath, remotefile)
	}

	//rclone copyto --retries 20 --retries-sleep=1s $file $remotefile &
	return c.s3.upload(c.paths.bucket, filepath, remotefile)
}

// A Task has been fully completed by a Worker
func (c client) markDone(task string) error {
	finishedMarker := filepath.Join(finished, task)
	return c.s3.mark(c.paths.bucket, c.localPathToRemote(finishedMarker), "done")
	/*if err := os.MkdirAll(finished, 0700); err != nil {
		return fmt.Errorf("ERROR failed to create finished directory: %v\n", err)
	} else if err := os.WriteFile(finishedMarker, []byte{}, 0644); err != nil {
		return fmt.Errorf("ERROR failed to touch finished marker: %v\n", err)
	} else {
		return c.reportChangedFile(finishedMarker)
	}*/
}

// Touch killfile for the given Worker
func (c client) touchKillFile(worker Worker) error {
	workerKillFileFilePath := filepath.Join(queues, worker.name, "kill")
	return c.s3.mark(c.paths.bucket, c.localPathToRemote(workerKillFileFilePath), "kill")
	/*if err := os.WriteFile(workerKillFileFilePath, []byte{}, 0644); err != nil {
		return fmt.Errorf("ERROR failed to touch killfile: %v\n", err)
	} else {
		return c.reportChangedFile(workerKillFileFilePath)
	}*/
}

// As part of assigning a Task to a Worker, we will move the Task to its Inbox
func (c client) moveToWorkerInbox(task string, worker Worker) error {
	unassignedFilePath := filepath.Join(inbox, task)
	workerInboxFilePath := filepath.Join(queues, worker.name, "inbox", task)

	/*if err := os.Rename(unassignedFilePath, workerInboxFilePath); err != nil {
		return fmt.Errorf("ERROR failed to move task=%s to worker inbox unassignedFilePath=%s workerInboxFilePath=%s: %v\n", task, unassignedFilePath, workerInboxFilePath, err)
	} else*/ {
		return c.reportMovedFile(unassignedFilePath, workerInboxFilePath)
	}
}

// As part of finishing up a Task, copy it from the Worker's Outbox to the final Outbox
func (c client) copyToFinalOutbox(task string, worker string, success TaskCode) error {
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

	/*if err := os.MkdirAll(outbox, 0700); err != nil {
		return fmt.Errorf("ERROR failed to create outbox directory: %v\n", err)
	} else*/ {
		/*if err := os.Link(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			return fmt.Errorf("ERROR failed to link output to final outbox: %v\n", err)
		} else*/ if err := c.reportLinkedFile(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil {
			return err
		}

		/*if err := os.Link(codeFileInWorkerOutbox, fullyDoneCodeFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			return fmt.Errorf("ERROR failed to link code to final outbox: %v\n", err)
		} else*/ if err := c.reportLinkedFile(codeFileInWorkerOutbox, fullyDoneCodeFilePath); err != nil {
			return err
		}

		/*if err := os.Link(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			return fmt.Errorf("ERROR failed to link stdout to final outbox: %v\n", err)
		} else*/ if err := c.reportLinkedFile(stdoutFileInWorkerOutbox, fullyDoneStdoutFilePath); err != nil {
			return err
		}

		/*if err := os.Link(stderrFileInWorkerOutbox, fullyDoneStderrFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			return fmt.Errorf("ERROR failed to link stderr to final outbox: %v\n", err)
		} else*/ if err := c.reportLinkedFile(stderrFileInWorkerOutbox, fullyDoneStderrFilePath); err != nil {
			return err
		}

		/*if err := os.Link(successFileInWorkerOutbox, fullyDoneSuccessFilePath); err != nil && !strings.Contains(err.Error(), "file exists") {
			return fmt.Errorf("ERROR failed to link success to final outbox: %v\n", err)
		} else*/ if err := c.reportLinkedFile(successFileInWorkerOutbox, fullyDoneSuccessFilePath); err != nil {
			return err
		}
	}

	return nil
}

// Assign an unassigned Task to one of the given LiveWorkers
func (c client) assignNewTaskToWorker(task string, worker Worker) error {
	fmt.Fprintf(os.Stderr, "DEBUG Assigning task=%s to worker=%s \n", task, worker.name)
	return c.moveToWorkerInbox(task, worker)
}

type Box string

const (
	Inbox      = "inbox"
	Processing = "processing"
	Outbox     = "outbox"
)

// A Worker has died. Unassign this task that it owns
func (c client) moveTaskBackToUnassigned(task string, worker Worker, box Box) error {
	inWorkerFilePath := filepath.Join(queues, worker.name, string(box), task)
	unassignedFilePath := filepath.Join(inbox, task)

	/*if err := os.MkdirAll(inbox, 0700); err != nil {
		return fmt.Errorf("ERROR failed to create inbox directory: %v\n", err)
	} else if err := os.Rename(inWorkerFilePath, unassignedFilePath); err != nil {
		return fmt.Errorf("ERROR failed to move assigned task back to unassigned: %v\n", err)
	} else*/ {
		return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
	}
}

// A Worker has transitioned from Live to Dead. Reassign its Tasks.
func (c client) cleanupForDeadWorker(worker Worker) error {
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
		if err := c.moveTaskBackToUnassigned(assignedTask, worker, "inbox"); err != nil {
			log.Fatalf(err.Error())
		}
	}
	for _, assignedTask := range worker.processingTasks {
		if err := c.moveTaskBackToUnassigned(assignedTask, worker, "processing"); err != nil {
			log.Fatalf(err.Error())
		}
	}

	return nil
}

// A Task has completed
func (c client) cleanupForCompletedTask(completedTask AssignedTask, success TaskCode) error {
	if err := c.markDone(completedTask.task); err != nil {
		return err
	}

	return c.copyToFinalOutbox(completedTask.task, completedTask.worker, success)
}

type Apportionment struct {
	startIdx int
	endIdx   int
	worker   Worker
}

func (c client) apportion(model Model) []Apportionment {
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

func (c client) assignNewTasks(model Model) {
	for _, A := range c.apportion(model) {
		nTasks := A.endIdx-A.startIdx
		fmt.Fprintf(os.Stderr, "INFO Assigning %s to %s\n", english.Plural(nTasks, "task", ""), strings.Replace(A.worker.name, run + "-", "", 1))
		for idx := range nTasks {
			task := model.UnassignedTasks[A.startIdx+idx]
			if err := c.assignNewTaskToWorker(task, A.worker); err != nil {
				log.Fatalf(err.Error())
			}
		}
	}
}

// Handle dead Workers
func (c client) reassignDeadWorkerTasks(model Model) {
	for _, worker := range model.DeadWorkers {
		if err := c.cleanupForDeadWorker(worker); err != nil {
			log.Fatalf(err.Error())
		}
	}
}

// Handle completed Tasks
func (c client) cleanupCompletedTasks(model Model) error {
	for _, completedTask := range model.SuccessfulTasks {
		if err := c.cleanupForCompletedTask(completedTask, "succeeded"); err != nil {
			log.Fatalf(err.Error())
		}
	}
	for _, completedTask := range model.FailedTasks {
		if err := c.cleanupForCompletedTask(completedTask, "failed"); err != nil {
			log.Fatalf(err.Error())
		}
	}

	return nil
}

// See if we need to rebalance workloads
func (c client) rebalance(model Model) bool {
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
						c.moveTaskBackToUnassigned(taskToSteal, workerWithWork, "inbox")
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
func (c client) touchKillFiles(model Model) {
	if model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0 {
		for _, worker := range model.LiveWorkers {
			if !worker.killfilePresent {
				if err := c.touchKillFile(worker); err != nil {
					log.Fatalf(err.Error())
				}
			}
		}
	}
}

// Is everything well and done: dispatcher, workers, us?
func (c client) readyToBye(model Model) bool {
	return model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0 && len(model.LiveWorkers) == 0
}

// Assess and potentially update queue state. Return true when we are all done.
func (c client) assess(m Model) bool {
	if c.readyToBye(m) {
		fmt.Fprintln(os.Stderr, "INFO All work has been completed, all workers have terminated")
		return true
	} else if !c.rebalance(m) {
		c.assignNewTasks(m)
		c.touchKillFiles(m)
		c.reassignDeadWorkerTasks(m)
		c.cleanupCompletedTasks(m)
	}

	return false
}
