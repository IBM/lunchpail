package queue

import (
	"regexp"
	"strconv"
)

var AnyStep = -1
var anyStepP = regexp.MustCompile("/step/\\" + strconv.Itoa(AnyStep))

var any = "*"
var anyPoolP = regexp.MustCompile("/pool/\\" + any)
var anyWorkerP = regexp.MustCompile("/worker/\\" + any)
var anyTaskP = regexp.MustCompile("\\" + any + "$") // task comes at the end

var placeholder = "xxxxxxxxxxxxxx"
var placeholderP = regexp.MustCompile(placeholder)

func (run RunContext) PatternFor(s Path) *regexp.Regexp {
	context := run.ForPool(placeholder).ForWorker(placeholder).ForTask(placeholder)
	pattern := placeholderP.ReplaceAllString(context.AsFile(s), "(.+)")

	if run.Step == AnyStep {
		pattern = anyStepP.ReplaceAllString(pattern, "/step/(\\d+)")
	}

	return regexp.MustCompile(pattern)
}
