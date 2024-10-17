package workstealer

import (
	"regexp"

	"lunchpail.io/pkg/fe/transformer/api"
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

func newPathPatterns(a api.PathArgs) pathPatterns {
	return pathPatterns{
		liveWorker:     a.PatternFor(api.WorkerAliveMarker),
		deadWorker:     a.PatternFor(api.WorkerDeadMarker),
		killfile:       a.PatternFor(api.WorkerKillFile),
		unassignedTask: a.PatternFor(api.Unassigned),
		assignedTask:   a.PatternFor(api.AssignedAndPending),
		processingTask: a.PatternFor(api.AssignedAndProcessing),
		outboxTask:     a.PatternFor(api.AssignedAndFinished),
		succeededTask:  a.PatternFor(api.FinishedWithSucceeded),
		failedTask:     a.PatternFor(api.FinishedWithFailed),
		dispatcherDone: a.PatternFor(api.DispatcherDoneMarker),
	}
}
