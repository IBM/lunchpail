package workstealer

import (
	"fmt"
	"log"
	"os"
	"slices"
	"strings"

	"github.com/dustin/go-humanize/english"

	"lunchpail.io/pkg/ir/queue"
)

func (c client) localPathToRemote(path string) string {
	return strings.Replace(path, c.RunContext.Bucket+"/", "", 1)
}

// Emit the path to the file we deleted
func (c client) reportMovedFile(src, dst string) error {
	rsrc := c.localPathToRemote(src)
	rdst := c.localPathToRemote(dst)
	if c.LogOptions.Debug {
		fmt.Fprintf(os.Stderr, "DEBUG Uploading moved file: %s -> %s\n", rsrc, rdst)
	}

	return c.s3.Moveto(c.RunContext.Bucket, rsrc, rdst)
}

// Touch killfile for the given Worker
func (c client) touchKillFile(worker Worker) error {
	return c.s3.Mark(c.RunContext.Bucket, c.RunContext.ForPool(worker.pool).ForWorker(worker.name).AsFile(queue.WorkerKillFile), "kill")
}

// As part of assigning a Task to a Worker, we will move the Task to its Inbox
func (c client) moveToWorkerInbox(task string, worker Worker) error {
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	workerInboxFilePath := c.RunContext.ForPool(worker.pool).ForWorker(worker.name).ForTask(task).AsFile(queue.AssignedAndPending)
	return c.reportMovedFile(unassignedFilePath, workerInboxFilePath)
}

// Assign an unassigned Task to one of the given LiveWorkers
func (c client) assignNewTaskToWorker(task string, worker Worker) error {
	if c.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Assigning task=%s to worker=%s \n", task, worker.name)
	}
	return c.moveToWorkerInbox(task, worker)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveAssignedTaskBackToUnassigned(task string, worker Worker) error {
	inWorkerFilePath := c.RunContext.ForPool(worker.pool).ForWorker(worker.name).ForTask(task).AsFile(queue.AssignedAndPending)
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveProcessingTaskBackToUnassigned(task string, worker Worker) error {
	inWorkerFilePath := c.RunContext.ForPool(worker.pool).ForWorker(worker.name).ForTask(task).AsFile(queue.AssignedAndProcessing)
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has transitioned from Live to Dead. Reassign its Tasks.
func (c client) cleanupForDeadWorker(worker Worker) error {
	nAssigned := len(worker.assignedTasks)
	nProcessing := len(worker.processingTasks)

	if nAssigned+nProcessing > 0 {
		fmt.Fprintf(
			os.Stderr,
			"INFO Reassigning dead worker tasks (it had %s assigned and was processing %s)\n",
			english.Plural(nAssigned, "task", ""),
			english.Plural(nProcessing, "task", ""),
		)
	}

	for _, assignedTask := range worker.assignedTasks {
		if err := c.moveAssignedTaskBackToUnassigned(assignedTask, worker); err != nil {
			log.Fatalf(err.Error())
		}
	}
	for _, assignedTask := range worker.processingTasks {
		if err := c.moveProcessingTaskBackToUnassigned(assignedTask, worker); err != nil {
			log.Fatalf(err.Error())
		}
	}

	return nil
}

// A Task has completed
func (c client) cleanupForCompletedTask(completedTask AssignedTask, success TaskCode) error {
	/*if !c.isMarkedDone(completedTask.task) {
		if err := c.markDone(completedTask.task); err != nil {
			return err
		}

		return nil
	}*/

	return nil
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

	if c.LogOptions.Verbose {
		fmt.Fprintf(
			os.Stderr,
			"Allocating %s to %s. Seeking %s per worker.\n",
			english.Plural(len(model.UnassignedTasks), "task", ""),
			english.Plural(len(model.LiveWorkers), "worker", ""),
			english.Plural(desiredLevel, "task", ""),
		)
	}

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
		nTasks := A.endIdx - A.startIdx
		fmt.Fprintf(os.Stderr, "Assigning %s to %s\n", english.Plural(nTasks, "task", ""), strings.Replace(A.worker.name, c.RunContext.RunName+"-", "", 1))
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
						"Stealing %s from %s\n",
						english.Plural(stealThisMany, "task", ""),
						workerWithWork.name,
					)

					for i := range stealThisMany {
						j := len(workerWithWork.assignedTasks) - i - 1
						taskToSteal := workerWithWork.assignedTasks[j]
						c.moveAssignedTaskBackToUnassigned(taskToSteal, workerWithWork)
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

// Touch kill files in the worker inboxes.
func (c client) touchKillFiles(model Model) {
	for _, worker := range model.LiveWorkers {
		if !worker.killfilePresent {
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Touching kill file for worker %s/%s\n", worker.pool, worker.name)
			}
			if err := c.touchKillFile(worker); err != nil {
				log.Fatalf(err.Error())
			}
		}
	}
}

// Assess and potentially update queue state. Return true when we are all done.
func (c client) assess(m Model) bool {
	c.cleanupCompletedTasks(m)

	if m.readyToBye() {
		fmt.Fprintln(os.Stderr, "All work has been completed, all workers have terminated")
		return true
	} else if !c.rebalance(m) {
		if c.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Not bye time allWorkDone=%v areAllWorkersQuiesced=%v missingKillFile?=%d isAllOutputConsumed=%v\n",
				m.isAllWorkDone(),
				m.areAllWorkersQuiesced(),
				slices.IndexFunc(m.DeadWorkers, func(w Worker) bool { return !w.killfilePresent }),
				m.isAllOutputConsumed(),
			)
		}

		c.assignNewTasks(m)

		if m.isAllWorkDone() {
			// If the dispatcher is done and there are no more outstanding tasks,
			// then touch kill files in the worker inboxes.
			c.touchKillFiles(m)
		}

		c.reassignDeadWorkerTasks(m)
	}

	return false
}
