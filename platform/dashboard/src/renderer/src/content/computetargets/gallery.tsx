import Gallery from "@jay/renderer/components/Gallery"

import Card from "./components/Card"

//import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
//import type { CurrentSettings } from "@jay/renderer/Settings"

type GalleryEvent = ManagedEvents["computetargets"][number]

function rank(a: GalleryEvent) {
  return a.spec.jaasManager ? 0 : a.spec.isJaaSWorkerHost ? 1 : 2
}

/** Sort ComputeTargets to place those with `isControlPlane` towards the front */
function sorter(a: GalleryEvent, b: GalleryEvent) {
  const aRank = rank(a)
  const bRank = rank(b)

  if (aRank === bRank) {
    return a.metadata.name.localeCompare(b.metadata.name)
  } else {
    return aRank - bRank
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
