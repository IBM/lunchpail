package status

import (
	"lunchpail.io/pkg/shrinkwrap/qstat"
	"slices"
)

func streamQstatUpdates(model *Model, qc chan qstat.Model, c chan Model) error {
	for qm := range qc {
		model.Qstat = qm

		// we need to align the `qm` which is a qstat.Model to
		// the `model` which is a status.Model
		for _, qpool := range qm.Pools {
			// look up qstat.Pool in status.Model.Pools
			pidx := slices.IndexFunc(model.Pools, func(pool Pool) bool { return pool.Name == qpool.Name })
			if pidx >= 0 {
				pool := model.Pools[pidx]
				for _, qworker := range qpool.LiveWorkers {
					widx := slices.IndexFunc(pool.Workers, func(worker Worker) bool { return worker.Name == qworker.Name })
					if widx >= 0 {
						pool.Workers[widx].Qstat = qworker
					}
				}
				for _, qworker := range qpool.DeadWorkers {
					widx := slices.IndexFunc(pool.Workers, func(worker Worker) bool { return worker.Name == qworker.Name })
					if widx >= 0 {
						pool.Workers[widx].Qstat = qworker
					}
				}

				model.Pools = slices.Concat(
					model.Pools[:pidx],
					[]Pool{pool},
					model.Pools[pidx+1:],
				)
			}
		}

		c <- *model
	}

	return nil
}
