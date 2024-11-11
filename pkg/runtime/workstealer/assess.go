package workstealer

import (
	"fmt"
	"os"
	"strings"

	"github.com/dustin/go-humanize/english"

	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/observe/queuestreamer"
)

// Emit the path to the file we deleted
func (c client) reportMovedFile(src, dst string) error {
	if c.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Uploading moved file: %s -> %s\n", src, dst)
	}

	return c.s3.Moveto(c.RunContext.Bucket, src, dst)
}

// Touch killfile for the given Worker
func (c client) touchKillFile(step int, worker queuestreamer.Worker) error {
	return c.s3.Mark(c.RunContext.Bucket, c.RunContext.ForStep(step).ForPool(worker.Pool).ForWorker(worker.Name).AsFile(queue.WorkerKillFile), "kill")
}

// As part of assigning a Task to a Worker, we will move the Task to its Inbox
func (c client) moveToWorkerInbox(step int, task string, worker queuestreamer.Worker) error {
	unassignedFilePath := c.RunContext.ForStep(step).ForTask(task).AsFile(queue.Unassigned)
	workerInboxFilePath := c.RunContext.ForStep(step).ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndPending)
	return c.reportMovedFile(unassignedFilePath, workerInboxFilePath)
}

// Assign an unassigned Task to one of the given LiveWorkers
func (c client) assignNewTaskToWorker(step int, task string, worker queuestreamer.Worker) error {
	return c.moveToWorkerInbox(step, task, worker)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveAssignedTaskBackToUnassigned(step int, task string, worker queuestreamer.Worker) error {
	inWorkerFilePath := c.RunContext.ForStep(step).ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndPending)
	unassignedFilePath := c.RunContext.ForStep(step).ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has died. Unassign this task that it owns
func (c client) moveProcessingTaskBackToUnassigned(step int, task string, worker queuestreamer.Worker) error {
	inWorkerFilePath := c.RunContext.ForStep(step).ForPool(worker.Pool).ForWorker(worker.Name).ForTask(task).AsFile(queue.AssignedAndProcessing)
	unassignedFilePath := c.RunContext.ForStep(step).ForTask(task).AsFile(queue.Unassigned)
	return c.reportMovedFile(inWorkerFilePath, unassignedFilePath)
}

// A Worker has transitioned from Live to Dead. Reassign its Tasks.
func (c client) cleanupForDeadWorker(step queuestreamer.Step, worker queuestreamer.Worker) error {
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
		if err := c.moveAssignedTaskBackToUnassigned(step.Index, assignedTask, worker); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
		}
	}
	for _, assignedTask := range worker.ProcessingTasks {
		if err := c.moveProcessingTaskBackToUnassigned(step.Index, assignedTask, worker); err != nil {
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
			"Allocating step=%d %s to %s. Seeking %s per worker.\n",
			m.Index,
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
		fmt.Fprintf(os.Stderr, "Assigning step=%d %s to worker=%s\n", m.Index, english.Plural(nTasks, "task", ""), strings.Replace(A.worker.Name, c.RunContext.RunName+"-", "", 1))
		for idx := range nTasks {
			task := m.UnassignedTasks[A.startIdx+idx]
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Assigning step=%d task=%s to worker=%s \n", m.Index, task, A.worker.Name)
			}
			if err := c.assignNewTaskToWorker(m.Index, task, A.worker); err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
			}
		}
	}
}

// Handle dead Workers
func (c client) reassignDeadWorkerTasks(m queuestreamer.Step) {
	for _, worker := range m.DeadWorkers {
		if err := c.cleanupForDeadWorker(m, worker); err != nil {
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
						c.moveAssignedTaskBackToUnassigned(m.Index, taskToSteal, workerWithWork)
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
			fmt.Fprintf(os.Stderr, "Touching kill file for step=%d pool=%s worker=%s\n", m.Index, worker.Pool, worker.Name)
			if err := c.touchKillFile(m.Index, worker); err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
			}
		}
	}
}

func dispatcherDone(model queuestreamer.Model, step queuestreamer.Step) bool {
	// a bit of a hack until we fully remove the notion of DispatcherDone; the last step is really the output of the pipeline
	return step.DispatcherDone || step.Index == len(model.Steps) && len(step.LiveWorkers) == 0 && len(step.DeadWorkers) == 0
}

// Is everything well and done: dispatcher, workers, us?
func readyToBye(model queuestreamer.Model) bool {
	for _, m := range model.Steps {
		if !(dispatcherDone(model, m) && m.IsAllWorkDone() && m.AreAllWorkersQuiesced() && m.IsAllOutputConsumed()) {
			return false
		}
	}
	return true
}

// Assess and potentially update queue state. Return true when we are all done.
func (c client) assess(model queuestreamer.Model, m queuestreamer.Step) {
	if !c.rebalance(m) {
		c.assignNewTasks(m)

		if m.IsAllWorkDone() {
			// If the dispatcher is done and there are no more outstanding tasks,
			// then touch kill files in the worker inboxes.
			c.touchKillFiles(m)
		}

		c.reassignDeadWorkerTasks(m)
	}
}
