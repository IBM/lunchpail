import { useMemo } from "react"

import Gallery from "@jaas/renderer/components/Gallery"

import Card from "./components/Card"

//import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
//import type { CurrentSettings } from "@jaas/renderer/Settings"

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

export default function gallery(events: ManagedEvents /*, memos: Memos, settings: CurrentSettings*/) {
  return <ComputeTargetsGallery computetargets={events.computetargets} />
}

function ComputeTargetsGallery(props: Pick<ManagedEvents, "computetargets">) {
  const cards = useMemo(
    () => props.computetargets.sort(sorter).map((event) => <Card key={event.metadata.name} {...event} />),
    [JSON.stringify(props.computetargets)],
  )

  return (
    <Gallery minWidths={widths} maxWidths={widths}>
      {cards}
    </Gallery>
  )
}
