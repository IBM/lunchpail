import Card from "./components/Card"

import type ManagedEvents from "../ManagedEvent"

export default function Gallery(events: ManagedEvents) {
  return events.workdispatchers.map((evt) => <Card key={evt.metadata.name} workdispatcher={evt} />)
}
