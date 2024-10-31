package queue

type Path string

const (
	Unassigned            Path = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/unassigned/{{.Task}}"
	AssignedAndPending         = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/inbox/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	AssignedAndProcessing      = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/processing/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	AssignedAndFinished        = `lunchpail/run/{{.RunName}}/queue/step/{{len (printf "a%*s" .Step "")}}/unassigned/{{.Task}}` // i.e. step 1's output is step 2's input; the len is magic for +1 https://stackoverflow.com/a/72465098/5270773
	FinishedWithCode           = "lunchpail/run/{{.RunName}}/meta/step/{{.Step}}/exitcode/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithStdout         = "lunchpail/run/{{.RunName}}/meta/step/{{.Step}}/stdout/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithStderr         = "lunchpail/run/{{.RunName}}/meta/step/{{.Step}}/stderr/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithSucceeded      = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/succeeded/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	FinishedWithFailed         = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/failed/pool/{{.PoolName}}/worker/{{.WorkerName}}/{{.Task}}"
	WorkerKillFile             = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/killfiles/pool/{{.PoolName}}/worker/{{.WorkerName}}"
	AllDoneMarker              = "lunchpail/run/{{.RunName}}/queue/alldone" // Note: not step-specific!
	DispatcherDoneMarker       = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/marker/dispatcherdone"
	WorkerAliveMarker          = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/marker/alive/pool/{{.PoolName}}/worker/{{.WorkerName}}"
	WorkerDeadMarker           = "lunchpail/run/{{.RunName}}/queue/step/{{.Step}}/marker/dead/pool/{{.PoolName}}/worker/{{.WorkerName}}"
	Executable                 = "lunchpail/run/{{.RunName}}/data/{{.Executable}}"
)
