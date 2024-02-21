import { useMemo } from "react"

// import either from "../util/either"
import { queueWorkerPool } from "./events/QueueEvent"
import toWorkerPoolModel from "./workerpools/toWorkerPoolModel"

import type ManagedEvents from "./ManagedEvent"
import type QueueEvent from "@jaas/common/events/QueueEvent"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"
import type { WorkerPoolModelWithHistory } from "./workerpools/WorkerPoolModel"

type Memos = {
  taskqueueToWorkDispatchers: Record<string, WorkDispatcherEvent[]>
  latestWorkerPoolModels: WorkerPoolModelWithHistory[]
}

export default Memos

export function initMemos(events: ManagedEvents): Memos {
  const { workdispatchers, workerpools, queues } = events

  /** A memo of the mapping from TaskQueue to WorkDispatcherEvents */
  const taskqueueToWorkDispatchers = useMemo(
    () =>
      workdispatchers.reduce(
        (M, event) => {
          if (!M[event.spec.dataset]) {
            M[event.spec.dataset] = []
          }
          M[event.spec.dataset].push(event)
          return M
        },
        {} as Record<string, WorkDispatcherEvent[]>,
      ),
    [workdispatchers],
  )

  /** A memo of the latest WorkerPoolModels, one per worker pool */
  const latestWorkerPoolModels: WorkerPoolModelWithHistory[] = useMemo(() => {
    const queueEventsForWorkerPool = queues.reduce(
      (M, event) => {
        const workerpool = queueWorkerPool(event)
        if (!M[workerpool]) {
          M[workerpool] = []
        }
        M[workerpool].push(event)
        return M
      },
      {} as Record<string, QueueEvent[]>,
    )

    return workerpools
      .map((pool) => {
        const queueEventsForOneWorkerPool = queueEventsForWorkerPool[pool.metadata.name]
        return toWorkerPoolModel(pool, queueEventsForOneWorkerPool)
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [workerpools, queues])

  return {
    taskqueueToWorkDispatchers,
    latestWorkerPoolModels,
  }
}
