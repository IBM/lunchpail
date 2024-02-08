import { useMemo } from "react"

import either from "../util/either"
import { queueWorkerPool } from "./events/QueueEvent"
import toWorkerPoolModel from "./workerpools/toWorkerPoolModel"

import type ManagedEvents from "./ManagedEvent"
import type QueueEvent from "@jaas/common/events/QueueEvent"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"
// import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"
import type { WorkerPoolModelWithHistory } from "./workerpools/WorkerPoolModel"

type Memos = {
  taskqueueIndex: Record<string, number>
  // taskqueueToPool: Record<string, WorkerPoolStatusEvent[]>
  taskqueueToWorkDispatchers: Record<string, WorkDispatcherEvent[]>
  latestWorkerPoolModels: WorkerPoolModelWithHistory[]
}

export default Memos

export function initMemos(events: ManagedEvents): Memos {
  const { workdispatchers, workerpools, queues, taskqueues } = events

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

  /** A memo of the mapping from TaskQueue to WorkerPools */
  /* const taskqueueToPool = useMemo(
    () =>
      workerpools.reduce(
        (M, event) => {
          [event.spec.dataset].forEach((taskqueue) => {
            if (!M[taskqueue]) {
              M[taskqueue] = []
            }
            M[taskqueue].push(event)
          })
          return M
        },
        {} as Record<string, WorkerPoolStatusEvent[]>,
      ),
    [workerpools],
  ) */

  /**
   * A memo of the mapping from TaskQueue to its position in the UI --
   * this helps us to keep coloring consistent across the views -- we
   * will use the index into a color lookup table in the CSS (see
   * GridCell.scss).
   */
  const taskqueueIndex = useMemo(
    () =>
      taskqueues.reduce(
        (M, event) => {
          if (!(event.metadata.name in M.index)) {
            M.index[event.metadata.name] = either(event.spec?.idx, M.next++)
          }
          return M
        },
        { next: 0, index: {} as Record<string, number> },
      ).index,
    [taskqueues],
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
    taskqueueIndex,
    // taskqueueToPool,
    taskqueueToWorkDispatchers,
    latestWorkerPoolModels,
  }
}
