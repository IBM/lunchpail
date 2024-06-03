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
		return "Workers"
	case DispatcherComponent:
		return "Dispatch"
	case WorkStealerComponent:
		return "Runtime"
	default:
		return string(c)
	}
}
