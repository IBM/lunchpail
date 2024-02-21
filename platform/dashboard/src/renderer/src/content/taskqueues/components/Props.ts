import type ManagedEvents from "../../ManagedEvent"

import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export type PropsSummary = Pick<ManagedEvents, "runs"> & {
  taskqueue: TaskQueueEvent
}

type Props = Pick<TaskQueueEvent["metadata"], "name" | "context"> & {
  /** To keep a consistent color across views, we assign each taskqueue an index */
  idx: number

  /** History of events associated with this TaskQueue */
  events: TaskQueueEvent[]

  /** WorkerPools processing this TaskQueue */
  workerpools: WorkerPoolStatusEvent[]
}

export default Props
