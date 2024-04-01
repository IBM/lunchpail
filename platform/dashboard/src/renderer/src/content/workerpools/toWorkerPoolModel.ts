import { queueInbox, queueOutbox, queueProcessing, queueWorkerIndex } from "@jaas/renderer/content/events/QueueEvent"

import type QueueEvent from "@jaas/common/events/QueueEvent"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"
import type { WorkerPoolModel, WorkerPoolModelWithHistory } from "./WorkerPoolModel"

/** Fill in zero for workers that haven't been observed */
function backfill<T extends WorkerPoolModel["inbox"] | WorkerPoolModel["outbox"] | WorkerPoolModel["processing"]>(
  A: T,
): T {
  for (let idx = 0; idx < A.length; idx++) {
    if (!(idx in A)) A[idx] = 0
  }
  return A
}

/**
 * Ugh, this is an ugly remnant of earlier models -- it helps
 * conform the clean models here to what WorkerPool card/detail
 * models need for their plots. TODO...
 */
export default function toWorkerPoolModel(
  pool: WorkerPoolStatusEvent,
  queueEventsForOneWorkerPool: QueueEvent[] = [],
): WorkerPoolModelWithHistory {
  const model = queueEventsForOneWorkerPool.reduce(
    (M, queueEvent) => {
      const inbox = queueInbox(queueEvent)
      const outbox = queueOutbox(queueEvent)
      const processing = queueProcessing(queueEvent)
      const workerIndex = queueWorkerIndex(queueEvent)

      M.inbox[workerIndex] = inbox
      M.outbox[workerIndex] = outbox
      M.processing[workerIndex] = processing

      return M
    },
    { inbox: [], outbox: [], processing: [] } as Omit<WorkerPoolModel, "label" | "namespace" | "run" | "context">,
  )

  return {
    label: pool.metadata.name,
    context: pool.metadata.context,
    namespace: pool.metadata.namespace,
    run: pool.spec.run,
    inbox: backfill(model.inbox),
    outbox: backfill(model.outbox),
    processing: backfill(model.processing),
    events: queueEventsForOneWorkerPool.map((_) => ({ outbox: queueOutbox(_), timestamp: _.timestamp })),
    numEvents: queueEventsForOneWorkerPool.length,
  }
}
