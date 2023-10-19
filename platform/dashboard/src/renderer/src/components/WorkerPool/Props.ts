import type { WorkerPoolModelWithHistory } from "../WorkerPoolModel"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export default interface Props {
  model: WorkerPoolModelWithHistory

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>

  /** This will be ordered from least recent to most recent */
  statusHistory: WorkerPoolStatusEvent[]
}
