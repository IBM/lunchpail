package api

import (
	"bytes"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"
)

// i.e. "/run/{{.RunName}}/step/{{.Step}}"
func (q PathArgs) ListenPrefix() string {
	A := strings.Split(q.TemplateP(Unassigned), "/")
	return filepath.Join(A[0:5]...)
}

type QueuePath string

const (
	Unassigned            QueuePath = "lunchpail/run/{{.RunName}}/step/{{.Step}}/unassigned/{{.Task}}"
	AssignedAndPending              = "lunchpail/run/{{.RunName}}/step/{{.Step}}/inbox/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	AssignedAndProcessing           = "lunchpail/run/{{.RunName}}/step/{{.Step}}/processing/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	AssignedAndFinished             = `lunchpail/run/{{.RunName}}/step/{{len (printf "a%*s" .Step "")}}/unassigned/{{.Task}}` // i.e. step 1's output is step 2's input; the len is magic for +1 https://stackoverflow.com/a/72465098/5270773
	FinishedWithCode                = "lunchpail/run/{{.RunName}}/step/{{.Step}}/exitcode/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithStdout              = "lunchpail/run/{{.RunName}}/step/{{.Step}}/stdout/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithStderr              = "lunchpail/run/{{.RunName}}/step/{{.Step}}/stderr/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithSucceeded           = "lunchpail/run/{{.RunName}}/step/{{.Step}}/succeeded/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithFailed              = "lunchpail/run/{{.RunName}}/step/{{.Step}}/failed/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	WorkerKillFile                  = "lunchpail/run/{{.RunName}}/step/{{.Step}}/killfiles/pool/{{.PoolName}}/worker/{{.WorkerName}}"
	AllDoneMarker                   = "lunchpail/run/{{.RunName}}/step/{{.Step}}/marker/alldone"
	DispatcherDoneMarker            = "lunchpail/run/{{.RunName}}/step/{{.Step}}/marker/dispatcherdone"
	WorkerAliveMarker               = "lunchpail/run/{{.RunName}}/step/{{.Step}}/marker/alive/pool/{{.PoolName}}/worker/{{.WorkerName}}"
	WorkerDeadMarker                = "lunchpail/run/{{.RunName}}/step/{{.Step}}/marker/dead/pool/{{.PoolName}}/worker/{{.WorkerName}}"
)

type PathArgs struct {
	Bucket     string
	RunName    string
	Step       int
	PoolName   string
	WorkerName string
	Task       string
}

func (q PathArgs) ForPool(name string) PathArgs {
	q.PoolName = name
	return q
}

func (q PathArgs) ForWorker(name string) PathArgs {
	q.WorkerName = name
	return q
}

func (q PathArgs) ForTask(name string) PathArgs {
	q.Task = name
	return q
}

// Instantiate the given `path` template with the values of `q`
func (q PathArgs) Template(path QueuePath) (string, error) {
	tmpl, err := template.New("tmp").Parse(string(path))
	if err != nil {
		return "", err
	}

	var b bytes.Buffer
	if err := tmpl.Execute(&b, q); err != nil {
		return "", err
	}

	// Clean will remove trailing slashes
	return filepath.Clean(b.String()), nil
}

// As with Template() but returning "" in case of errors
func (q PathArgs) TemplateP(path QueuePath) string {
	s, err := q.Template(path)
	if err != nil {
		return ""
	}
	return s
}

// As with TemplateP() but returning the enclosing directory (i.e. not
// specific to a pool, a worker, or a task)
func (q PathArgs) TemplateDir(path QueuePath) string {
	return filepath.Dir(filepath.Dir(q.ForPool("").ForWorker("").ForTask("").TemplateP(path)))
}

var placeholder = "xxxxxxxxxxxxxx"
var placeholderR = regexp.MustCompile(placeholder)

func (q PathArgs) PatternFor(s QueuePath) *regexp.Regexp {
	pattern := q.ForPool(placeholder).ForWorker(placeholder).ForTask(placeholder).TemplateP(s)
	return regexp.MustCompile(placeholderR.ReplaceAllString(pattern, "(.+)"))
}

// This parses `object` using the given `path` template, expects to
// extract a task instance, and uses that the return a specialized
// PathArgs that uses that Task. This is helpful if you e.g. want to
// find the ExitCode file that matches a given AssignedAndFinished
// file.
func (q PathArgs) ForObject(path QueuePath, object string) (PathArgs, error) {
	match := q.PatternFor(path).FindStringSubmatch(object)
	if len(match) != 4 {
		return q, fmt.Errorf("ForObjectTask bad match %s %v", object, match)
	}
	return q.ForPool(match[1]).ForWorker(match[2]).ForTask(match[1]), nil
}
