import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

type Props = Pick<DataSetEvent, "idx" | "label"> & {
  events: DataSetEvent[]

  /** Latest set of Applications */
  applications: ApplicationSpecEvent[]

  /** Latest set of WorkerPools aimed at processing this DataSet */
  workerpools: WorkerPoolStatusEvent[]

  /** Latest set of TaskSimulators aimed at this DataSet */
  tasksimulators: TaskSimulatorEvent[]

  /** Map DataSetEvent.label to a dense index */
  datasetIndex: Record<string, number>
}

export default Props
