import type { WorkerPoolModelWithHistory } from "../WorkerPoolModel"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export default interface Props {
  model: WorkerPoolModelWithHistory

  /** This will be ordered from least recent to most recent */
  status?: WorkerPoolStatusEvent
}
