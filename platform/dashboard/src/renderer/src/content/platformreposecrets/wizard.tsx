import { lazy } from "react"

const NewPlatformRepoSecretWizard = lazy(() => import("./components/New/Wizard"))

export default function Wizard() {
  return <NewPlatformRepoSecretWizard />
}
