import ApplicationDetail from "./components/Detail"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jay/renderer/Settings"

export default function Detail(id: string, events: ManagedEvents, memos: Memos, settings: CurrentSettings) {
  const application = events.applications.find((_) => _.metadata.name === id)
  if (application) {
    const props = {
      settings,
      application,
      datasets: events.datasets,
      taskqueues: events.taskqueues,
      tasksimulators: events.tasksimulators,
      workerpools: events.workerpools,
      taskqueueIndex: memos.taskqueueIndex,
      latestWorkerPoolModels: memos.latestWorkerPoolModels,
    }
    return <ApplicationDetail {...props} />
  } else {
    return undefined
  }
}
