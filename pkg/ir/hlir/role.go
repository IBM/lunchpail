package hlir

type Role string

const (
	WorkerRole             Role = "worker"
	DispatchViaDropBoxRole      = "dispatch-via-dropbox"
)
