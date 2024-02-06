import { lazy } from "react"

import type ManagedEvents from "../ManagedEvent"
const NewWorkerPoolWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard(events: ManagedEvents) {
  return (
    <NewWorkerPoolWizard runs={events.runs} taskqueues={events.taskqueues} computetargets={events.computetargets} />
  )
}
