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

// Count of Live workers across all pools
func (model *Model) LiveWorkers() int {
	N := 0
	for _, pool := range model.Pools {
		N += len(pool.LiveWorkers)
	}
	return N
}

// Count of Dead workers across all pools
func (model *Model) DeadWorkers() int {
	N := 0
	for _, pool := range model.Pools {
		N += len(pool.DeadWorkers)
	}
	return N
}

// Count of Live or Dead workers across all pools
func (model *Model) Workers() int {
	return model.LiveWorkers() + model.DeadWorkers()
}
