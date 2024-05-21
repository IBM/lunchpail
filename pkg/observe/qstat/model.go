package qstat

type Worker struct {
	Name       string
	Inbox      int
	Processing int
	Outbox     int
	Errorbox   int
}

type Pool struct {
	Name        string
	LiveWorkers []Worker
	DeadWorkers []Worker
}

type Model struct {
	Valid      bool
	Timestamp  string
	Unassigned int
	Assigned   int
	Processing int
	Success    int
	Failure    int
	Pools      []Pool
}

func (model *Model) liveWorkers() int {
	N := 0
	for _, pool := range model.Pools {
		N += len(pool.LiveWorkers)
	}
	return N
}
