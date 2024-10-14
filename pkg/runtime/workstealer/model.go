package workstealer

import "slices"

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
	ConsumedTasks   []string
	FinishedTasks   []string
	LiveWorkers     []Worker
	DeadWorkers     []Worker

	AssignedTasks   []AssignedTask
	ProcessingTasks []AssignedTask

	SuccessfulTasks []AssignedTask
	FailedTasks     []AssignedTask
}

func (model Model) nFinishedTasks() int {
	return len(model.FinishedTasks)
}

func (model Model) nConsumedTasks() int {
	return len(model.ConsumedTasks)
}

func (model Model) nUnassignedTasks() int {
	return len(model.UnassignedTasks)
}

func (model Model) nAssignedTasks() int {
	return len(model.AssignedTasks)
}

// How many outstanding tasks do we have, i.e. either Unassigned, or
// Assigned.
func (model Model) nTasksRemaining() int {
	return model.nUnassignedTasks() + model.nAssignedTasks()
}

// Have we consumed all work that is ever going to be produced?
func (model Model) isAllWorkDone() bool {
	return model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0
}

// No live workers, some dead workers, and all dead workers have kill
// file (meaning that we intentionally asked them to self-destruct).
func (model Model) areAllWorkersQuiesced() bool {
	return len(model.LiveWorkers) == 0 &&
		len(model.DeadWorkers) > 0 &&
		slices.IndexFunc(model.DeadWorkers, func(w Worker) bool { return !w.killfilePresent }) < 0
}

// Has some output been produced?
func (model Model) hasSomeOutputBeenProduced() bool {
	return len(model.SuccessfulTasks)+len(model.FailedTasks) > 0
}

func (model Model) isAllOutputConsumed() bool {
	return model.hasSomeOutputBeenProduced() && model.nFinishedTasks() == model.nConsumedTasks()
}

// Is everything well and done: dispatcher, workers, us?
func (model Model) readyToBye() bool {
	return model.isAllWorkDone() && model.areAllWorkersQuiesced() && model.isAllOutputConsumed()
}
