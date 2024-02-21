import Gallery from "@jaas/renderer/components/Gallery"

import type Memos from "../memos"
import WorkerPoolCard from "./components/Card"
import type ManagedEvents from "../ManagedEvent"

export default function WorkerPoolsGallery(events: ManagedEvents, { latestWorkerPoolModels }: Memos) {
  return (
    <Gallery>
      {latestWorkerPoolModels.map((w) => (
        <WorkerPoolCard key={w.label} model={w} status={events.workerpools.find((_) => _.metadata.name === w.label)} />
      ))}
    </Gallery>
  )
}
