import type { WorkerPoolModelWithHistory } from "../WorkerPoolModel"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export default interface Props {
  model: WorkerPoolModelWithHistory

  /** Map TaskQueueEvent to a dense index */
  taskqueueIndex: Record<string, number>

  /** This will be ordered from least recent to most recent */
  status?: WorkerPoolStatusEvent
}
