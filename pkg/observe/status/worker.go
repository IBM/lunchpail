package status

import (
	"slices"

	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
)

func updateWorker(update events.ComponentUpdate, pools []Pool) ([]Pool, error) {
	workerStatus := update.Status
	name := update.Name

	// index of pool in `pools`
	pidx := slices.IndexFunc(pools, func(pool Pool) bool { return pool.Name == update.Pool })

	if pidx < 0 {
		// couldn't find the Pool
		if update.Type == watch.Deleted {
			// Deleted a Worker that in a Pool we haven't
			// yet seen; safe to ignore for now
			return pools, nil
		} else {
			// Added or Modified a Worker in a Pool we
			// haven't seen yet; create a record of both
			// the Pool and the Worker
			pool := Pool{update.Pool, update.Namespace, 1, update.Ctrl, []Worker{Worker{name, workerStatus, qstat.Worker{}}}}
			return append(pools, pool), nil
		}
	}

	// otherwise, we have seen the pool before
	pool := pools[pidx]

	// worker index in `pool.Workers`
	widx := slices.IndexFunc(pool.Workers, func(worker Worker) bool { return worker.Name == name })
	if widx >= 0 {
		// known Pool and known Worker
		if update.Type == watch.Deleted {
			// Remove record of Deleted Worker in known
			// Pool by splicing it out of the Workers slice
			pool.Workers = append(pool.Workers[:widx], pool.Workers[widx+1:]...)
			pool.Parallelism = len(pool.Workers)
			pool.Ctrl = update.Ctrl
		} else {
			worker := pool.Workers[widx]
			worker.Status = workerStatus
			pool.Workers = slices.Concat(pool.Workers[:widx], []Worker{worker}, pool.Workers[widx+1:])
			pool.Parallelism = len(pool.Workers)
			pool.Ctrl = update.Ctrl
		}
	} else {
		// known Pool but unknown Worker
		pool.Workers = append(pool.Workers, Worker{name, workerStatus, qstat.Worker{}})
	}

	return slices.Concat(pools[:pidx], []Pool{pool}, pools[pidx+1:]), nil
}
