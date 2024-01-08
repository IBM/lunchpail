import Gallery from "@jay/renderer/components/Gallery"

import type Memos from "../memos"
import WorkerPoolCard from "./components/Card"
import type ManagedEvents from "../ManagedEvent"

export default function WorkerPoolsGallery(events: ManagedEvents, { taskqueueIndex, latestWorkerPoolModels }: Memos) {
  return (
    <Gallery>
      {latestWorkerPoolModels.map((w) => (
        <WorkerPoolCard
          key={w.label}
          model={w}
          taskqueueIndex={taskqueueIndex}
          status={events.workerpools.find((_) => _.metadata.name === w.label)}
        />
      ))}
    </Gallery>
  )
}
