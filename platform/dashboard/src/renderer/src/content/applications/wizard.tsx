import { lazy } from "react"
import type ManagedEvents from "../ManagedEvent"

const NewApplicationWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard(events: ManagedEvents) {
  return <NewApplicationWizard datasets={events.datasets} />
}
