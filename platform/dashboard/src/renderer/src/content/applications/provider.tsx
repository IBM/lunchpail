import { lazy } from "react"

import ApplicationCard from "./components/Card"
import ApplicationDetail from "./components/Detail"

import { LinkToNewApplication } from "./components/New/Button"
const NewApplicationWizard = lazy(() => import("./components/New/Wizard"))

import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const applications: ContentProvider = {
  gallery: (events: ManagedEvents) =>
    events.applications.map((evt) => (
      <ApplicationCard
        key={evt.metadata.name}
        application={evt}
        datasets={events.datasets}
        taskqueues={events.taskqueues}
        workerpools={events.workerpools}
      />
    )),

  detail: (id: string, events: ManagedEvents) => {
    const application = events.applications.find((_) => _.metadata.name === id)
    if (application) {
      const props = {
        application,
        datasets: events.datasets,
        taskqueues: events.taskqueues,
        workerpools: events.workerpools,
      }
      return <ApplicationDetail {...props} />
    } else {
      return undefined
    }
  },

  actions: (settings: { inDemoMode: boolean }) => !settings.inDemoMode && <LinkToNewApplication startOrAdd="add" />,

  wizard: (events: ManagedEvents) => <NewApplicationWizard datasets={events.datasets} />,
}

export default applications
