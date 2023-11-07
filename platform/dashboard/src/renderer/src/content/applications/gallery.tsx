import ApplicationCard from "./components/Card"
import type ManagedEvents from "../ManagedEvent"

export default function Gallery(events: ManagedEvents) {
  return events.applications.map((evt) => (
    <ApplicationCard
      key={evt.metadata.name}
      application={evt}
      datasets={events.datasets}
      taskqueues={events.taskqueues}
      workerpools={events.workerpools}
    />
  ))
}
