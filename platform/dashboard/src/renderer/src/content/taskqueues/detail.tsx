import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jay/renderer/Settings"

import either from "../../util/either"
import TaskQueueDetail from "./components/Detail"

export default function Detail(
  id: string,
  context: string,
  events: ManagedEvents,
  { taskqueueIndex, taskqueueToPool, taskqueueToWorkDispatchers }: Memos,
  settings: CurrentSettings,
) {
  const thisTaskqueueEvents = events.taskqueues.filter((_) => _.metadata.name === id && _.metadata.context === context)
  if (thisTaskqueueEvents.length === 0) {
    return undefined
  } else {
    const props = {
      context,
      idx: either(thisTaskqueueEvents[thisTaskqueueEvents.length - 1].spec.idx, taskqueueIndex[id]),
      workerpools: taskqueueToPool[id] || [],
      workdispatchers: taskqueueToWorkDispatchers[id] || [],
      applications: events.applications || [],
      name: id,
      events: thisTaskqueueEvents,
      numEvents: thisTaskqueueEvents.length,
      taskqueueIndex,
      settings,
    }

    return { body: TaskQueueDetail(props) }
  }
}
