import type { CurrentSettings } from "@jaas/renderer/Settings"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

type Props = {
  /** Name of TaskQueue */
  name: TaskQueueEvent["metadata"]["name"]

  /** The cluster in which this resources resides */
  context: TaskQueueEvent["metadata"]["context"]

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
