import { lazy } from "react"
import type ManagedEvents from "../ManagedEvent"

const NewDataSetWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard({ platformreposecrets }: ManagedEvents) {
  return <NewDataSetWizard platformreposecrets={platformreposecrets} />
}
