import type RunEvent from "@jaas/common/events/RunEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jaas/common/events/ComputeTargetEvent"

/** <Wizard/> Props */
type Props = {
  runs: RunEvent[]
  taskqueues: TaskQueueEvent[]
  computetargets: ComputeTargetEvent[]
}

export default Props
