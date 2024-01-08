import Gallery from "@jay/renderer/components/Gallery"

import ApplicationCard from "./components/Card"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jay/renderer/Settings"

export default function ApplicationsGallery(events: ManagedEvents, memos: Memos, settings: CurrentSettings) {
  return (
    <Gallery>
      {events.applications.map((evt) => (
        <ApplicationCard
          key={evt.metadata.name}
          application={evt}
          settings={settings}
          datasets={events.datasets}
          taskqueues={events.taskqueues}
          workdispatchers={events.workdispatchers}
          workerpools={events.workerpools}
          taskqueueIndex={memos.taskqueueIndex}
          latestWorkerPoolModels={memos.latestWorkerPoolModels}
        />
      ))}
    </Gallery>
  )
}
