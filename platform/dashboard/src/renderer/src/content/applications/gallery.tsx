import ApplicationCard from "./components/Card"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"

export default function Gallery(events: ManagedEvents, memos: Memos) {
  return events.applications.map((evt) => (
    <ApplicationCard
      key={evt.metadata.name}
      application={evt}
      memos={memos}
      datasets={events.datasets}
      taskqueues={events.taskqueues}
      tasksimulators={events.tasksimulators}
      workerpools={events.workerpools}
    />
  ))
}
