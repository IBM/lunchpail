import Gallery from "@jaas/renderer/components/Gallery"

import Card from "./components/Card"
import MissingApplicationCard from "./components/MissingApplicationCard"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jaas/renderer/Settings"

export default function RunsGallery(events: ManagedEvents, memos: Memos, settings: CurrentSettings) {
  return (
    <Gallery>
      {events.runs.map((evt) => {
        const application = events.applications.find((_) => _.metadata.name === evt.spec.application.name)
        if (!application) {
          return <MissingApplicationCard key={evt.metadata.name} run={evt} />
        } else {
          return (
            <Card
              key={evt.metadata.name}
              run={evt}
              application={application}
              settings={settings}
              datasets={events.datasets}
              taskqueues={events.taskqueues}
              workdispatchers={events.workdispatchers}
              workerpools={events.workerpools}
              latestWorkerPoolModels={memos.latestWorkerPoolModels}
              latestQueueEvents={memos.latestQueueEvents}
            />
          )
        }
      })}
    </Gallery>
  )
}
