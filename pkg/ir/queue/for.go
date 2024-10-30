package queue

import "fmt"

func (run RunContext) ForStep(step int) RunContext {
	run.Step = step
	return run
}

func (run RunContext) ForPool(name string) RunContext {
	run.PoolName = name
	return run
}

func (run RunContext) ForWorker(name string) RunContext {
	run.WorkerName = name
	return run
}

func (run RunContext) ForTask(name string) RunContext {
	run.Task = name
	return run
}

// This parses `object` using the given `path` template, expects to
// extract a task instance, and uses that the return a specialized
// RunContext that uses that Task. This is helpful if you e.g. want to
// find the ExitCode file that matches a given AssignedAndFinished
// file.
func (run RunContext) ForObject(path Path, object string) (RunContext, error) {
	match := run.PatternFor(path).FindStringSubmatch(object)
	if len(match) != 4 {
		return run, fmt.Errorf("ForObjectTask bad match %s %v", object, match)
	}
	return run.ForPool(match[1]).ForWorker(match[2]).ForTask(match[3]), nil
}
