package lunchpail

type Component string

const (
	WorkersComponent     Component = "workerpool"
	DispatcherComponent            = "workdispatcher"
	WorkStealerComponent           = "workstealer"
	RuntimeComponent               = "lunchpail-controller"
	InternalS3Component            = "s3"
)
