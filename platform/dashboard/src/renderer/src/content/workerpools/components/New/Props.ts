import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jaas/common/events/ComputeTargetEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

/** <Wizard/> Props */
type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
  computetargets: ComputeTargetEvent[]
}

export default Props
