import Gallery from "@jay/renderer/components/Gallery"

import Card from "./components/Card"

//import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
//import type { CurrentSettings } from "@jay/renderer/Settings"

type GalleryEvent = ManagedEvents["computetargets"][number]

/** Sort ComputeTargets to place those with `isControlPlane` towards the front */
function sorter(a: GalleryEvent, b: GalleryEvent) {
  const aIsManager = a.spec.isJaaSManager
  const bIsManager = b.spec.isJaaSManager
  if ((aIsManager && bIsManager) || (!aIsManager && !bIsManager)) {
    return a.metadata.name.localeCompare(b.metadata.name)
  } else if (aIsManager) {
    return -1
  } else {
    return 1
  }
}

const widths = { default: "21em" }

export default function ComputeTargetsGallery(events: ManagedEvents /*, memos: Memos, settings: CurrentSettings*/) {
  return (
    <Gallery minWidths={widths} maxWidths={widths}>
      {events.computetargets.sort(sorter).map((event) => (
        <Card key={event.metadata.name} {...event} />
      ))}
    </Gallery>
  )
}
