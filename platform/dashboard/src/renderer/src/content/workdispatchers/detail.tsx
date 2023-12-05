import WorkDispatcherDetail from "./components/Detail"
import type ManagedEvents from "../ManagedEvent"

export default function Detail(id: string, events: ManagedEvents) {
  const workdispatcher = events.workdispatchers.find((_) => _.metadata.name === id)
  if (workdispatcher) {
    return { body: <WorkDispatcherDetail workdispatcher={workdispatcher} /> }
  } else {
    return undefined
  }
}
