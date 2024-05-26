package observe

type Component string

const (
	WorkersComponent     Component = "workerpool"
	DispatcherComponent            = "workdispatcher"
	WorkStealerComponent           = "workstealer"
	InternalS3Component            = "s3"
)

func ComponentShortName(c Component) string {
	switch c {
	case WorkersComponent:
		return "Worker"
	case DispatcherComponent:
		return "Dispatch"
	case WorkStealerComponent:
		return "Balancer"
	case InternalS3Component:
		return "Queue"
	default:
		return string(c)
	}
}
