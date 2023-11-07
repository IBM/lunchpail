import type ManagedEvents from "../ManagedEvent"
import ApplicationDetail from "./components/Detail"

export default function Detail(id: string, events: ManagedEvents) {
  const application = events.applications.find((_) => _.metadata.name === id)
  if (application) {
    const props = {
      application,
      datasets: events.datasets,
      taskqueues: events.taskqueues,
      workerpools: events.workerpools,
    }
    return <ApplicationDetail {...props} />
  } else {
    return undefined
  }
}
