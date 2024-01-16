import { lazy } from "react"
// import type ManagedEvents from "../ManagedEvent"

const NewComputeTargetWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard(/*events: ManagedEvents*/) {
  return <NewComputeTargetWizard />
}
