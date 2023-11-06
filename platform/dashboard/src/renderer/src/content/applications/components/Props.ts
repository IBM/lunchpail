import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

type Props = {
  application: ApplicationSpecEvent
  datasets: DataSetEvent[]
  taskqueues: TaskQueueEvent[]
  workerpools: WorkerPoolStatusEvent[]
}

export default Props
