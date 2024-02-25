import type { WorkerPoolModelWithHistory } from "../WorkerPoolModel"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export default interface Props {
  model: WorkerPoolModelWithHistory

  /** The most recent model */
  status?: WorkerPoolStatusEvent
}
