package queue

// A specification of the context that defines a run
type RunContext struct {
	// The S3 bucket that will house this run's queue data
	Bucket string

	// The name of this run
	RunName string

	// Which step of the run are we participating in?
	Step int

	// Are we the final step of a pipeline?
	IsFinalStep bool

	// Which worker pool are we part of?
	PoolName string

	// Which worker are we?
	WorkerName string

	// Which task are we processing?
	Task string
}

func (r RunContext) IncrStep() RunContext {
	r.Step++
	return r
}

func (r RunContext) AsFinalStep(isFinalStep bool) RunContext {
	r.IsFinalStep = isFinalStep
	return r
}
