import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

type Props = {
  application: ApplicationSpecEvent
  taskqueues: string[]
  datasets: string[]
  workerpools: WorkerPoolStatusEvent[]
}

export default Props
