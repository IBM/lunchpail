import type ManagedEvents from "../../ManagedEvent"

import type RunEvent from "@jaas/common/events/RunEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

export type PropsSummary = Pick<ManagedEvents, "runs"> & {
  taskqueue: TaskQueueEvent
}

type Props = Pick<TaskQueueEvent["metadata"], "name" | "context"> & {
  /** Associated Run */
  run: RunEvent

  /** History of events associated with this TaskQueue */
  events: TaskQueueEvent[]
}

export default Props
