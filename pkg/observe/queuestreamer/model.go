package queuestreamer

import "slices"

// A Task that was assigned to a given Worker
type AssignedTask struct {
	Pool   string
	Worker string
	Task   string
}

type Worker struct {
	Alive           bool
	NSuccess        uint
	NFail           uint
	Pool            string
	Name            string
	AssignedTasks   []string
	ProcessingTasks []string
	KillfilePresent bool
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
	OutboxTasks     []string

	LiveWorkers []Worker
	DeadWorkers []Worker

	AssignedTasks   []AssignedTask
	ProcessingTasks []AssignedTask

	SuccessfulTasks []AssignedTask
	FailedTasks     []AssignedTask
}

func (model Model) nOutboxTasks() int {
	return len(model.OutboxTasks)
}

func (model Model) nFinishedTasks() int {
	return len(model.SuccessfulTasks) + len(model.FailedTasks)
}

func (model Model) nConsumedTasks() int {
	return model.nFinishedTasks() - model.nOutboxTasks()
}

func (model Model) nUnassignedTasks() int {
	return len(model.UnassignedTasks)
}

func (model Model) nAssignedTasks() int {
	return len(model.AssignedTasks)
}

func (model Model) nProcessingTasks() int {
	return len(model.ProcessingTasks)
}

// How many outstanding tasks do we have, i.e. either Unassigned, or
// Assigned, or still being Processed.
func (model Model) nTasksRemaining() int {
	return model.nUnassignedTasks() + model.nAssignedTasks() + model.nProcessingTasks()
}

// Have we consumed all work that is ever going to be produced?
func (model Model) IsAllWorkDone() bool {
	return model.DispatcherDone && model.nFinishedTasks() > 0 && model.nTasksRemaining() == 0
}

// No live workers, some dead workers, and all dead workers have kill
// file (meaning that we intentionally asked them to self-destruct).
func (model Model) AreAllWorkersQuiesced() bool {
	return len(model.LiveWorkers) == 0 &&
		len(model.DeadWorkers) > 0 &&
		slices.IndexFunc(model.DeadWorkers, func(w Worker) bool { return !w.KillfilePresent }) < 0
}

// Has some output been produced?
func (model Model) hasSomeOutputBeenProduced() bool {
	return len(model.SuccessfulTasks)+len(model.FailedTasks) > 0
}

func (model Model) IsAllOutputConsumed() bool {
	return model.hasSomeOutputBeenProduced() && model.nFinishedTasks() == model.nConsumedTasks()
}
