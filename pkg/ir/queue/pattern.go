package queue

import "regexp"

var any = "*"
var anyPoolP = regexp.MustCompile("/pool/\\" + any)
var anyWorkerP = regexp.MustCompile("/worker/\\" + any)
var anyTaskP = regexp.MustCompile("\\" + any + "$") // task comes at the end

var placeholder = "xxxxxxxxxxxxxx"
var placeholderR = regexp.MustCompile(placeholder)

func (run RunContext) PatternFor(s Path) *regexp.Regexp {
	pattern := run.ForPool(placeholder).ForWorker(placeholder).ForTask(placeholder).AsFile(s)
	return regexp.MustCompile(placeholderR.ReplaceAllString(pattern, "(.+)"))
}
