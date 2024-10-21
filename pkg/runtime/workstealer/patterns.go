package workstealer

import (
	"regexp"

	q "lunchpail.io/pkg/ir/queue"
)

type pathPatterns struct {
	liveWorker     *regexp.Regexp
	deadWorker     *regexp.Regexp
	killfile       *regexp.Regexp
	unassignedTask *regexp.Regexp
	assignedTask   *regexp.Regexp
	processingTask *regexp.Regexp
	outboxTask     *regexp.Regexp
	succeededTask  *regexp.Regexp
	failedTask     *regexp.Regexp
	dispatcherDone *regexp.Regexp
}

func newPathPatterns(run q.RunContext) pathPatterns {
	return pathPatterns{
		liveWorker:     run.PatternFor(q.WorkerAliveMarker),
		deadWorker:     run.PatternFor(q.WorkerDeadMarker),
		killfile:       run.PatternFor(q.WorkerKillFile),
		unassignedTask: run.PatternFor(q.Unassigned),
		assignedTask:   run.PatternFor(q.AssignedAndPending),
		processingTask: run.PatternFor(q.AssignedAndProcessing),
		outboxTask:     run.PatternFor(q.AssignedAndFinished),
		succeededTask:  run.PatternFor(q.FinishedWithSucceeded),
		failedTask:     run.PatternFor(q.FinishedWithFailed),
		dispatcherDone: run.PatternFor(q.DispatcherDoneMarker),
	}
}
