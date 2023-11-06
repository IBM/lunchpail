import either from "../either"

import TaskQueueDetail from "./components/Detail"

import { name, singular } from "./name"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const taskqueues: ContentProvider = {
  name,

  singular,

  description: "not needed",

  detail: (
    id: string,
    allEvents: ManagedEvents,
    { taskqueueIndex, taskqueueToPool, taskqueueToTaskSimulators }: Memos,
  ) => {
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
      }

      return TaskQueueDetail(props)
    }
  },
}

export default taskqueues
