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
	// One sub-model per step
	Steps []Step
}

type Step struct {
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

	_workersLookup map[string]*Worker
}

func (step Step) nOutboxTasks() int {
	return len(step.OutboxTasks)
}

func (step Step) nFinishedTasks() int {
	return len(step.SuccessfulTasks) + len(step.FailedTasks)
}

func (step Step) nConsumedTasks() int {
	return step.nFinishedTasks() - step.nOutboxTasks()
}

func (step Step) nUnassignedTasks() int {
	return len(step.UnassignedTasks)
}

func (step Step) nAssignedTasks() int {
	return len(step.AssignedTasks)
}

func (step Step) nProcessingTasks() int {
	return len(step.ProcessingTasks)
}

// How many outstanding tasks do we have, i.e. either Unassigned, or
// Assigned, or still being Processed.
func (step Step) nTasksRemaining() int {
	return step.nUnassignedTasks() + step.nAssignedTasks() + step.nProcessingTasks()
}

// Have we consumed all work that is ever going to be produced?
func (step Step) IsAllWorkDone() bool {
	return step.DispatcherDone && step.nFinishedTasks() > 0 && step.nTasksRemaining() == 0
}

// No live workers, some dead workers, and all dead workers have kill
// file (meaning that we intentionally asked them to self-destruct).
func (step Step) AreAllWorkersQuiesced() bool {
	return len(step.LiveWorkers) == 0 &&
		len(step.DeadWorkers) > 0 &&
		slices.IndexFunc(step.DeadWorkers, func(w Worker) bool { return !w.KillfilePresent }) < 0
}

// Has some output been produced?
func (step Step) hasSomeOutputBeenProduced() bool {
	return len(step.SuccessfulTasks)+len(step.FailedTasks) > 0
}

func (step Step) IsAllOutputConsumed() bool {
	return step.hasSomeOutputBeenProduced() && step.nFinishedTasks() == step.nConsumedTasks()
}
