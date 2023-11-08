import type { CurrentSettings } from "@jay/renderer/Settings"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

type Props = {
  /** Name of TaskQueue */
  name: TaskQueueEvent["metadata"]["name"]

  /** To keep a consistent color across views, we assign each taskqueue an index */
  idx: number

  /** */
  events: TaskQueueEvent[]

  /** Latest set of Applications */
  applications: ApplicationSpecEvent[]

  /** Latest set of WorkerPools aimed at processing this TaskQueue */
  workerpools: WorkerPoolStatusEvent[]

  /** Latest set of TaskSimulators aimed at this TaskQueue */
  tasksimulators: TaskSimulatorEvent[]

  /** Map TaskQueueEvent to a dense index */
  taskqueueIndex: Record<string, number>

  /** Current Settings context */
  settings: CurrentSettings
}

export default Props
