import type { CurrentSettings } from "@jay/renderer/Settings"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type WorkDispatcherEvent from "@jay/common/events/WorkDispatcherEvent"
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

  /** Latest set of WorkDispatchers aimed at this TaskQueue */
  workdispatchers: WorkDispatcherEvent[]

  /** Current Settings context */
  settings: CurrentSettings
}

export default Props
