import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jay/renderer/Settings"

import either from "../../util/either"
import TaskQueueDetail from "./components/Detail"

export default function Detail(
  id: string,
  allEvents: ManagedEvents,
  { taskqueueIndex, taskqueueToPool, taskqueueToTaskSimulators }: Memos,
  settings: CurrentSettings,
) {
  const events = allEvents.taskqueues.filter((_) => _.metadata.name === id)
  if (events.length === 0) {
    return undefined
  } else {
    const props = {
      idx: either(events[events.length - 1].spec.idx, taskqueueIndex[id]),
      workerpools: taskqueueToPool[id] || [],
      tasksimulators: taskqueueToTaskSimulators[id] || [],
      applications: allEvents.applications || [],
      name: id,
      events,
      numEvents: events.length,
      taskqueueIndex,
      settings,
    }

    return TaskQueueDetail(props)
  }
}
