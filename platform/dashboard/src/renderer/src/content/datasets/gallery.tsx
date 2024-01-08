import Gallery from "@jay/renderer/components/Gallery"

import DataSetCard from "./components/Card"
import type ManagedEvents from "../ManagedEvent"

export default function DataSetGallery(events: ManagedEvents) {
  return (
    <Gallery>
      {events.datasets.map((evt) => (
        <DataSetCard key={evt.metadata.name} {...evt} />
      ))}
    </Gallery>
  )
}
