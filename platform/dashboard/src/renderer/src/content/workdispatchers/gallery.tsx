import Gallery from "@jaas/renderer/components/Gallery"

import Card from "./components/Card"

import type ManagedEvents from "../ManagedEvent"

export default function WorkDispatchersGallery(events: ManagedEvents) {
  return (
    <Gallery>
      {events.workdispatchers.map((evt) => (
        <Card key={evt.metadata.name} workdispatcher={evt} />
      ))}
    </Gallery>
  )
}
