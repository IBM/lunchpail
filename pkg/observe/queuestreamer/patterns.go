package queuestreamer

import (
	"regexp"

	q "lunchpail.io/pkg/ir/queue"
)

type PathPatterns struct {
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

func NewPathPatterns(run q.RunContext) PathPatterns {
	run = run.ForStep(q.AnyStep)

	return PathPatterns{
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
