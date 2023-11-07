import { lazy } from "react"
const NewDataSetWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard() {
  return <NewDataSetWizard />
}
