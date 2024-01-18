import WorkDispatcherDetail from "./components/Detail"
import type ManagedEvents from "../ManagedEvent"

export default function Detail(id: string, context: string, events: ManagedEvents) {
  const workdispatcher = events.workdispatchers.find((_) => _.metadata.name === id && _.metadata.context === context)
  if (workdispatcher) {
    return { body: <WorkDispatcherDetail workdispatcher={workdispatcher} /> }
  } else {
    return undefined
  }
}
