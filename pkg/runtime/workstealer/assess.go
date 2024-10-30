package workstealer

import (
	"fmt"
	"os"
	"slices"
	"strings"

	"github.com/dustin/go-humanize/english"

	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/observe/queuestreamer"
)

func (c client) localPathToRemote(path string) string {
	return strings.Replace(path, c.RunContext.Bucket+"/", "", 1)
}

// Emit the path to the file we deleted
func (c client) reportMovedFile(src, dst string) error {
	rsrc := c.localPathToRemote(src)
	rdst := c.localPathToRemote(dst)
	if c.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Uploading moved file: %s -> %s\n", rsrc, rdst)
	}

	return c.s3.Moveto(c.RunContext.Bucket, rsrc, rdst)
}

// Touch killfile for the given Worker
func (c client) touchKillFile(worker queuestreamer.Worker) error {
	return c.s3.Mark(c.RunContext.Bucket, c.RunContext.ForPool(worker.Pool).ForWorker(worker.Name).AsFile(queue.WorkerKillFile), "kill")
}

// As part of assigning a Task to a Worker, we will move the Task to its Inbox
func (c client) moveToWorkerInbox(task string, worker queuestreamer.Worker) error {
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	workerInboxFilePath := c.RunContext.ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndPending)
	return c.reportMovedFile(unassignedFilePath, workerInboxFilePath)
}

// Assign an unassigned Task to one of the given LiveWorkers
func (c client) assignNewTaskToWorker(task string, worker queuestreamer.Worker) error {
	if c.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Assigning task=%s to worker=%s \n", task, worker.Name)
	}
	return c.moveToWorkerInbox(task, worker)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveAssignedTaskBackToUnassigned(task string, worker queuestreamer.Worker) error {
	inWorkerFilePath := c.RunContext.ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndPending)
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveProcessingTaskBackToUnassigned(task string, worker queuestreamer.Worker) error {
	inWorkerFilePath := c.RunContext.ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndProcessing)
	unassignedFilePath := c.RunContext.ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has transitioned from Live to Dead. Reassign its Tasks.
func (c client) cleanupForDeadWorker(worker queuestreamer.Worker) error {
	nAssigned := len(worker.AssignedTasks)
	nProcessing := len(worker.ProcessingTasks)

	if nAssigned+nProcessing > 0 {
		fmt.Fprintf(
			os.Stderr,
			"Reassigning dead worker tasks (it had %s assigned and was processing %s)\n",
			english.Plural(nAssigned, "task", ""),
			english.Plural(nProcessing, "task", ""),
		)
	}

	for _, assignedTask := range worker.AssignedTasks {
		if err := c.moveAssignedTaskBackToUnassigned(assignedTask, worker); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
		}
	}
	for _, assignedTask := range worker.ProcessingTasks {
		if err := c.moveProcessingTaskBackToUnassigned(assignedTask, worker); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
		}
	}

	return nil
}

type Apportionment struct {
	startIdx int
	endIdx   int
	worker   queuestreamer.Worker
}

func (c client) apportion(m queuestreamer.Step) []Apportionment {
	As := []Apportionment{}

	if len(m.LiveWorkers) == 0 || len(m.UnassignedTasks) == 0 {
		// nothing to do: either no live workers or no unassigned tasks
		return As
	}

	desiredLevel := max(1, len(m.UnassignedTasks)/len(m.LiveWorkers))

	if c.LogOptions.Verbose {
		fmt.Fprintf(
			os.Stderr,
			"Allocating %s to %s. Seeking %s per worker.\n",
			english.Plural(len(m.UnassignedTasks), "task", ""),
			english.Plural(len(m.LiveWorkers), "worker", ""),
			english.Plural(desiredLevel, "task", ""),
		)
	}

	startIdx := 0
	for _, worker := range m.LiveWorkers {
		if startIdx >= len(m.UnassignedTasks) {
			break
		}

		assignThisMany := max(0, desiredLevel-len(worker.AssignedTasks))

		if assignThisMany > 0 {
			endIdx := startIdx + assignThisMany
			As = append(As, Apportionment{startIdx, endIdx, worker})
			startIdx = endIdx
		}
	}

	return As
}

func (c client) assignNewTasks(m queuestreamer.Step) {
	for _, A := range c.apportion(m) {
		nTasks := A.endIdx - A.startIdx
		fmt.Fprintf(os.Stderr, "Assigning %s to %s\n", english.Plural(nTasks, "task", ""), strings.Replace(A.worker.Name, c.RunContext.RunName+"-", "", 1))
		for idx := range nTasks {
			task := m.UnassignedTasks[A.startIdx+idx]
			if err := c.assignNewTaskToWorker(task, A.worker); err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
			}
		}
	}
}

// Handle dead Workers
func (c client) reassignDeadWorkerTasks(m queuestreamer.Step) {
	for _, worker := range m.DeadWorkers {
		if err := c.cleanupForDeadWorker(worker); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
		}
	}
}

// See if we need to rebalance workloads
func (c client) rebalance(m queuestreamer.Step) bool {
	if len(m.UnassignedTasks) == 0 {
		// If we had some unassigned Tasks, we probably
		// wouldnm't need to rebalance; we could just send
		// those Tasks to the starving Workers. Since we have
		// no unassigned Tasks, we might want to consider
		// reassigning Tasks between Workers.

		// Tally up live Workers with and without work. We aim
		// to shift load from those with to those without.
		workersWithWork := []queuestreamer.Worker{}
		workersWithoutWork := []queuestreamer.Worker{}
		for _, worker := range m.LiveWorkers {
			if len(worker.AssignedTasks) == 0 && len(worker.ProcessingTasks) == 0 {
				workersWithoutWork = append(workersWithoutWork, worker)
			} else {
				workersWithWork = append(workersWithWork, worker)
			}
		}

		if len(workersWithWork) > 0 && len(workersWithoutWork) > 0 {
			// Then we can shift load from those with to
			// those without!
			desiredLevel := max(1, (len(m.AssignedTasks)+len(m.ProcessingTasks))/len(m.LiveWorkers))
			stoleSomeTasks := false

			// then we can steal at least one Task
			for _, workerWithWork := range workersWithWork {
				if stealThisMany := max(0, len(workerWithWork.AssignedTasks)-desiredLevel); stealThisMany > 0 {
					stoleSomeTasks = true
					fmt.Fprintf(
						os.Stderr,
						"Stealing %s from %s\n",
						english.Plural(stealThisMany, "task", ""),
						workerWithWork.Name,
					)

					for i := range stealThisMany {
						j := len(workerWithWork.AssignedTasks) - i - 1
						taskToSteal := workerWithWork.AssignedTasks[j]
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
func (c client) touchKillFiles(m queuestreamer.Step) {
	for _, worker := range m.LiveWorkers {
		if !worker.KillfilePresent {
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Touching kill file for worker %s/%s\n", worker.Pool, worker.Name)
			}
			if err := c.touchKillFile(worker); err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
			}
		}
	}
}

// Is everything well and done: dispatcher, workers, us?
func readyToBye(m queuestreamer.Step) bool {
	return m.DispatcherDone && m.IsAllWorkDone() && m.AreAllWorkersQuiesced() && m.IsAllOutputConsumed()
}

// Assess and potentially update queue state. Return true when we are all done.
func (c client) assess(m queuestreamer.Step) bool {
	if readyToBye(m) {
		fmt.Fprintln(os.Stderr, "All work has been completed, all workers have terminated")
		return true
	} else if !c.rebalance(m) {
		if c.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Not bye time allWorkDone=%v areAllWorkersQuiesced=%v missingKillFile?=%d isAllOutputConsumed=%v\n",
				m.IsAllWorkDone(),
				m.AreAllWorkersQuiesced(),
				slices.IndexFunc(m.DeadWorkers, func(w queuestreamer.Worker) bool { return !w.KillfilePresent }),
				m.IsAllOutputConsumed(),
			)
		}

		c.assignNewTasks(m)

		if m.IsAllWorkDone() {
			// If the dispatcher is done and there are no more outstanding tasks,
			// then touch kill files in the worker inboxes.
			c.touchKillFiles(m)
		}

		c.reassignDeadWorkerTasks(m)
	}

	return false
}
