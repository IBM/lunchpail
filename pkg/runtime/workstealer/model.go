package workstealer

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
