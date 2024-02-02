import { lazy } from "react"
import type ManagedEvents from "../ManagedEvent"

const NewWorkDispatcherWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard(events: ManagedEvents) {
  return <NewWorkDispatcherWizard applications={events.applications} runs={events.runs} />
}
