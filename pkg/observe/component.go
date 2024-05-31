package observe

type Component string

const (
	WorkersComponent     Component = "workerpool"
	DispatcherComponent            = "workdispatcher"
	WorkStealerComponent           = "workstealer"
)

func ComponentShortName(c Component) string {
	switch c {
	case WorkersComponent:
		return "Worker"
	case DispatcherComponent:
		return "Dispatch"
	case WorkStealerComponent:
		return "Balancer"
	default:
		return string(c)
	}
}
