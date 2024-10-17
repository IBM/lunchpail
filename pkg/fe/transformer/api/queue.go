package api

import (
	"fmt"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/fe/linker/queue"
)

// Path in s3 to store the queue for the given run
func QueuePrefixPath0(queueSpec queue.Spec, runname string) string {
	return filepath.Join("lunchpail", runname)
}

// Path in s3 to store the queue for the given run
func QueuePrefixPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(queueSpec.Bucket, QueuePrefixPath0(queueSpec, runname))
}

// The queue path for a worker that specifies the pool name and the worker name
func QueueSubPathForWorker(poolName, workerName string) string {
	return filepath.Join(poolName, workerName)
}

// Opposite of `QueueSubPathForWorker`, e.g. test7f-pool1/w96bh -> (test7f-pool1,w96bh)
func ExtractNamesFromSubPathForWorker(combo string) (poolName string, workerName string, err error) {
	if idx := strings.Index(combo, "/"); idx < 0 {
		// TODO error handling here. what do we want to do?
		err = fmt.Errorf("Invalid subpath %s", combo)
	} else {
		poolName = combo[:idx]
		workerName = combo[idx+1:]
	}
	return
}

// Path in s3 to store the queue data for a particular worker in a
// particular pool for a particular run. Note how we need to defer the
// worker name until run time, which we do via a
// $LUNCHPAIL_POD_NAME env var.
func QueuePrefixPathForWorker0(queueSpec queue.Spec, runname, poolName string) string {
	return filepath.Join(
		QueuePrefixPath0(queueSpec, runname),
		"queues",
		QueueSubPathForWorker(poolName, "$LUNCHPAIL_POD_NAME"),
	)
}

// Path in s3 to store the queue data for a particular worker in a
// particular pool for a particular run. Note how we need to defer the
// worker name until run time, which we do via a
// $LUNCHPAIL_POD_NAME env var.
func QueuePrefixPathForWorker(queueSpec queue.Spec, runname, poolName string) string {
	return filepath.Join(
		queueSpec.Bucket,
		QueuePrefixPathForWorker0(queueSpec, runname, poolName),
	)
}

func UnassignedPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(QueuePrefixPath0(queueSpec, runname), "inbox")
}

func OutboxPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(QueuePrefixPath0(queueSpec, runname), "outbox")
}

func FinishedPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(QueuePrefixPath0(queueSpec, runname), "finished")
}

func WorkerKillfilePathBase(queueSpec queue.Spec, runname string) string {
	return WorkerInboxPathBase(queueSpec, runname)
}

func WorkerKillfile(base, worker string) string {
	return filepath.Join(base, worker, "kill")
}

func WorkerInboxPathBase(queueSpec queue.Spec, runname string) string {
	return filepath.Join(QueuePrefixPath0(queueSpec, runname), "queues")
}

func WorkerInbox(base, worker, task string) string {
	return filepath.Join(base, worker, "inbox", task)
}

// for Worker
func Inbox(base string) string {
	return filepath.Join(base, "inbox")
}

// for Worker
func InboxTask(base, task string) string {
	return filepath.Join(Inbox(base), task)
}

func WorkerProcessingPathBase(queueSpec queue.Spec, runname string) string {
	return WorkerInboxPathBase(queueSpec, runname)
}

func WorkerProcessing(base, worker, task string) string {
	return filepath.Join(base, worker, "processing", task)
}

// for Worker
func Processing(base string) string {
	return filepath.Join(base, "processing")
}

// for Worker
func ProcessingTask(base, task string) string {
	return filepath.Join(Processing(base), task)
}

func WorkerOutboxPathBase(queueSpec queue.Spec, runname string) string {
	return WorkerInboxPathBase(queueSpec, runname)
}

func WorkerOutbox(base, worker, task string) string {
	return filepath.Join(base, worker, "outbox", task)
}

// for Worker
func Outbox(base string) string {
	return filepath.Join(base, "outbox")
}

// for Worker
func OutboxTask(base, task string) string {
	return filepath.Join(Outbox(base), task)
}

// for Worker
func ExitCodeTask(base, task string) string {
	return filepath.Join(Outbox(base), task+".code")
}

// for Worker
func SucceededTask(base, task string) string {
	return filepath.Join(Outbox(base), task+".succeeded")
}

// for Worker
func FailedTask(base, task string) string {
	return filepath.Join(Outbox(base), task+".failed")
}

// for Worker
func StdoutTask(base, task string) string {
	return filepath.Join(Outbox(base), task+".stdout")
}

// for Worker
func StderrTask(base, task string) string {
	return filepath.Join(Outbox(base), task+".stderr")
}

func WorkerAlive(queueSpec queue.Spec, runname, poolname string) string {
	return WorkerInbox(WorkerInboxPathBase(queueSpec, runname), filepath.Join(poolname, "$LUNCHPAIL_POD_NAME"), ".alive")
}

func WorkerDead(queueSpec queue.Spec, runname, poolname string) string {
	return WorkerInbox(WorkerInboxPathBase(queueSpec, runname), filepath.Join(poolname, "$LUNCHPAIL_POD_NAME"), ".dead")
}

func AllDone(queueSpec queue.Spec, runname string) string {
	return filepath.Join(QueuePrefixPath0(queueSpec, runname), "alldone")
}
