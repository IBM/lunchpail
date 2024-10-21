package queue

import "regexp"

var placeholder = "xxxxxxxxxxxxxx"
var placeholderR = regexp.MustCompile(placeholder)

func (run RunContext) PatternFor(s Path) *regexp.Regexp {
	pattern := run.ForPool(placeholder).ForWorker(placeholder).ForTask(placeholder).AsFile(s)
	return regexp.MustCompile(placeholderR.ReplaceAllString(pattern, "(.+)"))
}
