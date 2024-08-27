package events

type WorkerStatus string

const (
	Pending     WorkerStatus = "Pending"
	Booting                  = "Booting"
	Running                  = "Running"
	Succeeded                = "Succeeded"
	Failed                   = "Failed"
	Terminating              = "Terminating"
)
