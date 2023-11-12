import ApplicationCard from "./components/Card"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jay/renderer/Settings"

export default function Gallery(events: ManagedEvents, memos: Memos, settings: CurrentSettings) {
  return events.applications.map((evt) => (
    <ApplicationCard
      key={evt.metadata.name}
      application={evt}
      settings={settings}
      datasets={events.datasets}
      taskqueues={events.taskqueues}
      tasksimulators={events.tasksimulators}
      workerpools={events.workerpools}
      taskqueueIndex={memos.taskqueueIndex}
      latestWorkerPoolModels={memos.latestWorkerPoolModels}
    />
  ))
}
