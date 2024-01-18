import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

/** <Wizard/> Props */
type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
  computetargets: ComputeTargetEvent[]
}

export default Props
